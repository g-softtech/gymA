
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
    async signIn({ user }) {
      // If the user has no tenantId, try to assign one from their callbackUrl
      if (user.id && !user.tenantId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { tenantId: true },
        });

        if (!dbUser?.tenantId) {
          // Extract slug from the stored callbackUrl cookie isn't available here,
          // so we assign tenantId in the jwt callback on first load instead
        }
      }
      return true;
    },

    async jwt({ token, user, trigger }) {
      // On first sign-in, user object is present
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.tenantId = user.tenantId;
      }

      // On every request, re-fetch tenantId from DB in case it was just assigned
      if (token.id && !token.tenantId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { tenantId: true, role: true },
        });
        if (dbUser?.tenantId) {
          token.tenantId = dbUser.tenantId;
          token.role = dbUser.role;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        // session.user.tenantId = token.tenantId as string | undefined;
        session.user.tenantId = (token.tenantId as string) ?? undefined;
      }
      return session;
    },
  },
};

export function getAuthSession(): Promise<Session | null> {
  return getServerSession(authOptions);
}
