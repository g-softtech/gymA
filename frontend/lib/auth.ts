// Authentication configuration
// import { NextAuthOptions, Session } from "next-auth";
// import NextAuth, { type NextAuthOptions, type Session } from "next-auth";
import NextAuth from "next-auth";
import type { NextAuthOptions, Session } from "next-auth";
import { getServerSession } from "next-auth/next";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "placeholder",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "placeholder",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.tenantId = user.tenantId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.tenantId = token.tenantId as string;
      }
      return session;
    },
  },
};

/**
 * Production-grade helper to get the typed server session.
 * This bypasses the NextAuth getServerSession inference bug
 * and enforces the augmented Session type globally.
 */
export function getAuthSession(): Promise<Session | null> {
  return getServerSession(authOptions);
}