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
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email.toLowerCase().trim();
        const user = await prisma.user.findUnique({
          where: { email },
        });

        console.log(`[AUTH VERIFY] authorize(): email=${email} provider=credentials dbFound=${!!user}`);

        if (!user) {
          throw new Error("Invalid email or password.");
        }

        if (!user.password) {
          // User exists but signed up via Google — no password set
          throw new Error("This account uses Google Sign-In. Please use the Google button.");
        }

        const passwordMatch = await bcrypt.compare(credentials.password, user.password);
        if (!passwordMatch) {
          throw new Error("Invalid email or password.");
        }

        console.log(`[AUTH VERIFY] authorize() Success: id=${user.id} role=${user.role} tenantId=${user.tenantId}`);

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
      // 1. Establish anchor: always use the email to look up the real database user.
      const anchorEmail = token.email || user?.email;
      
      console.log(`[AUTH VERIFY] jwt() Input: token.id=${token.id} token.sub=${token.sub} user.id=${user?.id} anchorEmail=${anchorEmail}`);

      // 2. Fetch the single source of truth from Database
      if (anchorEmail) {
        const dbUser = await prisma.user.findUnique({
          where: { email: anchorEmail as string },
          select: { id: true, role: true, tenantId: true },
        });
        
        if (dbUser) {
          // 3. Hydrate token with guaranteed DB values
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.tenantId = dbUser.tenantId ?? undefined;
          
          console.log(`[AUTH VERIFY] jwt() Hydrated from DB: id=${token.id} role=${token.role} tenantId=${token.tenantId}`);
        } else {
          console.error(`[AUTH VERIFY] jwt() CRITICAL: User not found in DB for email=${anchorEmail}`);
        }
      }

      return token;
    },

    async session({ session, token }) {
      // 4. Ensure complete, unconditional hydration of the client session
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.tenantId = token.tenantId as string | undefined;
      }
      
      console.log(`[AUTH VERIFY] session() Out: id=${session.user?.id} email=${session.user?.email} role=${session.user?.role} tenantId=${session.user?.tenantId}`);
      
      return session;
    },
  },
};

export function getAuthSession(): Promise<Session | null> {
  return getServerSession(authOptions);
}

export default NextAuth(authOptions);
