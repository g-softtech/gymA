import NextAuth from "next-auth";
import type { NextAuthOptions, Session } from "next-auth";
import { getServerSession } from "next-auth/next";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
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
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("[AUTH TRACE] Missing email or password in credentials");
          return null;
        }

        const email = credentials.email.toLowerCase().trim();
        const user = await prisma.user.findUnique({
          where: { email },
        });

        console.log("[AUTH TRACE] User Found", {
          id: user?.id,
          email: user?.email,
          hasPassword: !!user?.password,
        });

        if (!user) {
          console.log("[AUTH TRACE] Rejecting: User not found in DB");
          throw new Error("Invalid email or password.");
        }

        if (!user.password) {
          console.log("[AUTH TRACE] Rejecting: Account has no password (Google-only)");
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
          throw new Error("Invalid email or password.");
        }

        console.log("[AUTH TRACE] Returning User", {
          id: user.id,
          role: user.role,
          tenantId: user.tenantId
        });

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
  ],

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },

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
          tenant: { select: { slug: true } },
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
      token.id = dbUser.id;
      token.role = dbUser.role;
      token.tenantId = dbUser.tenantId ?? undefined;
      token.tenantSlug = dbUser.tenant?.slug ?? null;

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
      }

      console.log(`${TRACE} └─ OUTGOING session.user:`);
      console.log(`${TRACE}    session.user.id        = ${session.user?.id ?? "undefined"}`);
      console.log(`${TRACE}    session.user.email     = ${session.user?.email ?? "undefined"}`);
      console.log(`${TRACE}    session.user.role      = ${session.user?.role ?? "undefined"}`);
      console.log(`${TRACE}    session.user.tenantId  = ${session.user?.tenantId ?? "undefined"}`);
      console.log(`${TRACE}    session.user.tenantSlug= ${session.user?.tenantSlug ?? "undefined"}`);

      return session;
    },
  },
};

export function getAuthSession(): Promise<Session | null> {
  return getServerSession(authOptions);
}

export default NextAuth(authOptions);
