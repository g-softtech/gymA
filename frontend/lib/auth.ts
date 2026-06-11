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

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user?.password) {
          // User exists but signed up via Google — no password set
          throw new Error("This account uses Google Sign-In. Please use the Google button.");
        }

        const passwordMatch = await bcrypt.compare(credentials.password, user.password);
        if (!passwordMatch) {
          throw new Error("Incorrect password.");
        }

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
      // On first sign in
      if (user && account) {
        token.id = user.id;
        token.role = (user as any).role ?? "MEMBER";
        token.tenantId = (user as any).tenantId ?? undefined;
      }

      // ALWAYS re-fetch role and tenantId from DB on every request
      // This ensures role changes (e.g. MEMBER → TRAINER) take effect immediately
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, tenantId: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.tenantId = dbUser.tenantId ?? undefined;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.tenantId = token.tenantId as string | undefined;
      }
      return session;
    },
  },
};

export function getAuthSession(): Promise<Session | null> {
  return getServerSession(authOptions);
}

export default NextAuth(authOptions);
