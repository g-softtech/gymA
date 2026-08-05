import NextAuth from "next-auth";
import type { NextAuthOptions, Session } from "next-auth";
import { getServerSession } from "next-auth/next";
import { headers, cookies } from "next/headers";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import bcrypt from "bcryptjs";
import { auditLogger, AuditEventType } from "./auditLogger";
import { enqueueEmail } from "./email/emailQueue";
import { CORTEXFIT_BRAND } from "./email/types";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours (sliding expiration)
  },
  providers: [
    // ── Google OAuth ──────────────────────────────────────────────────────────
    // Works in production. Requires valid GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET
    // and the redirect URI registered in Google Cloud Console.
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "online",
        },
      },
    }),

    // ── Email + Password (Credentials) ────────────────────────────────────────
    // Used for local dev, admin accounts, and as fallback when Google OAuth
    // is not configured. Works with any email + password stored in the DB.
    CredentialsProvider({
      id: "credentials",
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
        // Tenant context forwarded from the sign-in page to enforce cross-site isolation.
        tenantSlug: { label: "Tenant Slug", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("[AUTH TRACE] Missing email or password in credentials");
          return null;
        }

        const email = credentials.email.toLowerCase().trim();
        const tenantSlug = (credentials.tenantSlug as string) || null;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { tenant: { select: { slug: true, name: true } } },
        });

        console.log("[AUTH TRACE] User Found", {
          id: user?.id,
          email: user?.email,
          hasPassword: !!user?.password,
        });

        if (!user) {
          console.log("[AUTH TRACE] Rejecting: User not found in DB");
          auditLogger.log(AuditEventType.USER_FAILED_LOGIN, null, { email, reason: "User not found" });
          throw new Error("Invalid email or password.");
        }

        if (!user.password) {
          console.log("[AUTH TRACE] Rejecting: Account has no password (Google-only)");
          auditLogger.log(AuditEventType.USER_FAILED_LOGIN, user.tenantId, { email, reason: "No password set" }, user.id);
          throw new Error("This account uses Google Sign-In. Please use the Google button.");
        }

        console.log("[AUTH TRACE] Password Compare Starting");
        const passwordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        console.log("[AUTH TRACE] Password Compare Result", passwordValid);

        if (!passwordValid) {
          console.log("[AUTH TRACE] Rejecting: Password mismatch");
          auditLogger.log(AuditEventType.USER_FAILED_LOGIN, user.tenantId, { email, reason: "Password mismatch" }, user.id);
          throw new Error("Invalid email or password.");
        }

        // ── Safety net: cross-tenant isolation ────────────────────────────────
        // The pre-flight in the UI catches this first; this guard blocks any
        // direct API call that bypasses the frontend.
        //   • tenantSlug present  → user must belong to that exact tenant
        //   • tenantSlug absent   → user must not be a gym member (SUPERADMIN/platform only)
        if (user.role !== "SUPERADMIN") {
          if (tenantSlug) {
            if (user.tenant?.slug !== tenantSlug) {
              console.log("[AUTH TRACE] Rejecting: User does not belong to tenant", tenantSlug);
              auditLogger.log(AuditEventType.USER_FAILED_LOGIN, user.tenantId, { email, reason: `Cross-tenant credentials attempt for ${tenantSlug}` }, user.id);
              throw new Error("Invalid email or password.");
            }
          } else if (user.tenantId) {
            // Gym member trying to log in on the main site — block them
            console.log("[AUTH TRACE] Rejecting: Gym member attempting main-site login");
            auditLogger.log(AuditEventType.USER_FAILED_LOGIN, user.tenantId, { email, reason: "Main-site login blocked for gym member" }, user.id);
            throw new Error("Invalid email or password.");
          }
        }

        console.log("[AUTH TRACE] Returning User", {
          id: user.id,
          role: user.role,
          tenantId: user.tenantId
        });

        auditLogger.log(AuditEventType.USER_LOGIN, user.tenantId, { email, provider: "credentials" }, user.id);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          tenantId: user.tenantId ?? undefined,
        } as any;
      },
    }),

    // ── Magic Link (Email) ────────────────────────────────────────────────────
    EmailProvider({
      server: "", // Custom sendVerificationRequest bypasses Nodemailer
      // Domain is now verified, sending as thecortexsystems.com
      from: process.env.EMAIL_FROM || "CortexFit <noreply@thecortexsystems.com>",
      maxAge: 15 * 60, // 15 minutes expiration
      async sendVerificationRequest({ identifier: email, url, provider }) {
        // Extract tenant branding from the callback URL if available
        const parsedUrl = new URL(url);
        const callbackUrl = parsedUrl.searchParams.get("callbackUrl") || "";
        const match = callbackUrl.match(/\/gym\/([^\/]+)/);
        const tenantSlug = match ? match[1] : null;

        let gymName = "CortexFit";
        let isCreationFlow = callbackUrl.includes("/onboarding/process");
        let title = `Sign in to ${gymName}`;

        if (isCreationFlow) {
          const pending = await prisma.pendingSignup.findFirst({ where: { email, status: { in: ["NEW", "MAGIC_LINK_SENT"] } } });
          if (pending) {
            gymName = pending.gymName;
            title = `Create ${gymName}`;
          }
        } else if (tenantSlug) {
          const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug }, select: { name: true }});
          if (tenant) {
            gymName = tenant.name;
            title = `Sign in to ${gymName}`;
          }
        }

        // ── Safety net: tenant membership validation ──────────────────────────
        // The rate-limit pre-flight is the primary guard. This block prevents
        // any direct POST to /api/auth/signin/email from bypassing tenant checks.
        if (!isCreationFlow) {
          const requestingUser = await prisma.user.findUnique({
            where: { email },
            select: {
              tenantId: true,
              role: true,
              tenant: { select: { slug: true } },
            },
          });

          if (tenantSlug) {
            // Tenant-scoped: the requesting email must belong to this exact tenant
            if (!requestingUser || requestingUser.tenant?.slug !== tenantSlug) {
              console.error(`[AUTH] Magic link blocked: ${email} is not a member of tenant ${tenantSlug}`);
              throw new Error("Tenant membership validation failed.");
            }
          } else {
            // Main-site: only tenant-free accounts (no gym membership) may use magic link
            if (requestingUser?.tenantId && requestingUser.role !== "SUPERADMIN") {
              console.error(`[AUTH] Magic link blocked: gym member ${email} attempted main-site sign-in`);
              throw new Error("Tenant membership validation failed.");
            }
          }
        }

        try {
          await enqueueEmail({
            emailType: "MAGIC_LINK",
            recipient: email,
            subject: title,
            tenantId: tenantSlug || undefined,
            payload: {
              recipientName: "",
              magicUrl: url,
              gymName: gymName !== "CortexFit" ? gymName : undefined,
              isNewSignup: isCreationFlow,
            }
          });
        } catch (error) {
          console.error("Error enqueuing magic link email:", error);
          throw new Error("Failed to send verification email");
        }
      },
    }),
  ],

  pages: {
    signIn: "/auth/signin",  // custom sign-in page (created below)
    error: "/auth/error",
  },

  callbacks: {
    async jwt({ token, user, account }) {
      // ── FORENSIC INSTRUMENTATION (read-only, no logic changes) ──────────────
      const TRACE = `[FORENSIC:jwt][${Date.now()}]`;

      const anchorEmail = token.email || user?.email;

      console.log(`${TRACE} ┌─ ENTRY`);
      console.log(`${TRACE} │  token.sub       = ${token.sub ?? "undefined"}`);
      console.log(`${TRACE} │  token.email     = ${token.email ?? "undefined"}`);
      console.log(`${TRACE} │  token.id        = ${token.id ?? "undefined"}`);
      console.log(`${TRACE} │  token.role      = ${token.role ?? "undefined"}`);
      console.log(`${TRACE} │  token.tenantId  = ${token.tenantId ?? "undefined"}`);
      console.log(`${TRACE} │  token.tenantSlug= ${token.tenantSlug ?? "undefined"}`);
      console.log(`${TRACE} │  user?.id        = ${user?.id ?? "undefined"}`);
      console.log(`${TRACE} │  user?.email     = ${(user as any)?.email ?? "undefined"}`);
      console.log(`${TRACE} │  account?.provider=${account?.provider ?? "none (token refresh)"}`);
      console.log(`${TRACE} │  anchorEmail     = ${anchorEmail ?? "⚠️  NULL — DB lookup will be SKIPPED"}`);

      if (!anchorEmail) {
        console.error(`${TRACE} └─ ⚠️  SKIPPING DB LOOKUP: anchorEmail is null/undefined. Returning stale token.`);
        console.log(`${TRACE}    FINAL TOKEN: role=${token.role} tenantId=${token.tenantId} tenantSlug=${token.tenantSlug}`);
        return token;
      }

      // 2. Fetch the single source of truth from Database
      const dbUser = await prisma.user.findUnique({
        where: { email: anchorEmail as string },
        select: {
          id: true,
          role: true,
          tenantId: true,
          sessionVersion: true,
          password: true,
          tenant: { select: { slug: true, status: true } },
        },
      });

      console.log(`${TRACE} │  DB query by email="${anchorEmail}"`);

      if (!dbUser) {
        console.error(`${TRACE} └─ ❌ DB MISS: No user found for email=${anchorEmail}. Returning stale token.`);
        console.log(`${TRACE}    FINAL TOKEN: role=${token.role} tenantId=${token.tenantId} tenantSlug=${token.tenantSlug}`);
        return token;
      }

      console.log(`${TRACE} │  DB result:`);
      console.log(`${TRACE} │    dbUser.id        = ${dbUser.id}`);
      console.log(`${TRACE} │    dbUser.role      = ${dbUser.role}`);
      console.log(`${TRACE} │    dbUser.tenantId  = ${dbUser.tenantId ?? "null"}`);
      console.log(`${TRACE} │    dbUser.tenant.slug= ${dbUser.tenant?.slug ?? "null"}`);

      // 3. Hydrate token with guaranteed DB values
      
      // ✅ Session Revocation Check
      if (token.sessionVersion && token.sessionVersion !== dbUser.sessionVersion) {
        console.error(`${TRACE} └─ 🚨 REVOCATION TRIGGERED: DB sessionVersion=${dbUser.sessionVersion}, Token=${token.sessionVersion}`);
        throw new Error("Session revoked");
      }
      
      token.id = dbUser.id;
      token.role = dbUser.role;
      token.tenantId = dbUser.tenantId ?? undefined;
      token.tenantSlug = dbUser.tenant?.slug ?? null;
      token.tenantStatus = dbUser.tenant?.status ?? null;
      token.isDemo = dbUser.tenant?.isDemo ?? false;
      token.sessionVersion = dbUser.sessionVersion;
      token.hasPassword = !!dbUser.password;
      
      // If logging in right now (interactive login), record the provider and timestamp
      if (account) {
        token.provider = account.provider;
        token.authenticatedAt = Date.now();
      }

      console.log(`${TRACE} └─ FINAL TOKEN (after hydration):`);
      console.log(`${TRACE}    token.id        = ${token.id}`);
      console.log(`${TRACE}    token.role      = ${token.role}`);
      console.log(`${TRACE}    token.tenantId  = ${token.tenantId ?? "undefined"}`);
      console.log(`${TRACE}    token.tenantSlug= ${token.tenantSlug ?? "null"}`);

      return token;
    },

    async session({ session, token }) {
      // ── FORENSIC INSTRUMENTATION ──────────────────────────────────────────
      const TRACE = `[FORENSIC:session][${Date.now()}]`;

      console.log(`${TRACE} ┌─ ENTRY (incoming token)`);
      console.log(`${TRACE} │  token.sub        = ${token.sub ?? "undefined"}`);
      console.log(`${TRACE} │  token.id         = ${token.id ?? "undefined"}`);
      console.log(`${TRACE} │  token.role       = ${token.role ?? "undefined"}`);
      console.log(`${TRACE} │  token.tenantId   = ${token.tenantId ?? "undefined"}`);
      console.log(`${TRACE} │  token.tenantSlug = ${token.tenantSlug ?? "undefined"}`);
      console.log(`${TRACE} │  token.email      = ${token.email ?? "undefined"}`);

      // 4. Ensure complete, unconditional hydration of the client session
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.tenantId = token.tenantId as string | undefined;
        session.user.tenantSlug = token.tenantSlug as string | null | undefined;
        session.user.tenantStatus = token.tenantStatus as string | null | undefined;
        session.user.isDemo = token.isDemo as boolean | undefined;
        session.user.hasPassword = token.hasPassword as boolean;
        session.user.provider = token.provider as string | undefined;
        session.user.authenticatedAt = token.authenticatedAt as number | undefined;
      }

      console.log(`${TRACE} └─ OUTGOING session.user:`);
      console.log(`${TRACE}    session.user.id        = ${session.user?.id ?? "undefined"}`);
      console.log(`${TRACE}    session.user.email     = ${session.user?.email ?? "undefined"}`);
      console.log(`${TRACE}    session.user.role      = ${session.user?.role ?? "undefined"}`);
      console.log(`${TRACE}    session.user.tenantId  = ${session.user?.tenantId ?? "undefined"}`);
      console.log(`${TRACE}    session.user.tenantSlug= ${session.user?.tenantSlug ?? "undefined"}`);

      return session;
    },

    async redirect({ url, baseUrl }) {
      // Allow absolute URLs on the same origin (e.g. full magic-link callbackUrl)
      if (url.startsWith(baseUrl)) return url;
      // Allow relative paths (e.g. /gym/sinfit/dashboard/admin) — prepend origin
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Fallback: send to root
      return baseUrl;
    },
  },
};

export async function getAuthSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const impersonateUserId = cookieStore.get("sandbox_impersonate_userId")?.value;

    if (impersonateUserId) {
      const realUser = await prisma.user.findUnique({
        where: { id: impersonateUserId },
        include: { tenant: true }
      });
      // CRITICAL SECURITY: Only allow impersonation if the target user belongs to a Sandbox (isDemo) gym.
      // This guarantees the main production app is completely unaffected and secure.
      if (realUser && realUser.tenant?.isDemo) {
        return {
          user: {
            id: realUser.id,
            name: realUser.name || "Sandbox User",
            email: realUser.email || "guest@sandbox.local",
            image: realUser.image || null,
            role: realUser.role,
            tenantId: realUser.tenantId,
            tenantSlug: realUser.tenant?.slug,
            tenantStatus: realUser.tenant?.status,
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        } as Session;
      }
    }

    const headersList = await headers();
    const guestSlug = headersList.get("x-guest-session-tenant-slug");
    
    if (guestSlug) {
      const tenant = await prisma.tenant.findUnique({
        where: { slug: guestSlug },
        select: { id: true, name: true, slug: true, isDemo: true, users: { take: 1 } }
      });

      if (tenant && tenant.isDemo) {

        if (impersonateUserId) {
          // Fetch real user
          const realUser = await prisma.user.findUnique({
            where: { id: impersonateUserId, tenantId: tenant.id },
            select: { id: true, name: true, email: true, image: true, role: true }
          });
          
          if (realUser) {
            return {
              user: {
                id: realUser.id,
                name: realUser.name || "Sandbox User",
                email: realUser.email || "guest@sandbox.local",
                image: realUser.image || null,
                role: realUser.role,
                tenantId: tenant.id,
                tenantSlug: tenant.slug,
                tenantStatus: "APPROVED",
              },
              expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            } as Session;
          }
        }

        // Construct a mock admin session
        const fallbackUserId = tenant.users.length > 0 ? tenant.users[0].id : `guest-admin-${tenant.id}`;
        
        return {
          user: {
            id: fallbackUserId,
            name: "Sandbox Guest",
            email: "guest@sandbox.local",
            image: null,
            role: "ADMIN",
            tenantId: tenant.id,
            tenantSlug: tenant.slug,
            tenantStatus: "APPROVED",
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        } as Session;
      }
    }
  } catch (err) {
    console.error("[AUTH] Error checking guest session headers:", err);
  }

  return getServerSession(authOptions);
}

export default NextAuth(authOptions);
