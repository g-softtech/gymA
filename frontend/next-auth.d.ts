import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      tenantId?: string;
      tenantSlug?: string | null;
      tenantStatus?: string | null;
      hasPassword?: boolean;
      provider?: string;
      authenticatedAt?: number;
      isDemo?: boolean;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role?: string;
    tenantId?: string;
    tenantSlug?: string | null;
    tenantStatus?: string | null;
    hasPassword?: boolean;
    provider?: string;
    isDemo?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role?: string;
    tenantId?: string;
    tenantSlug?: string | null;
    tenantStatus?: string | null;
    sessionVersion?: number;
    hasPassword?: boolean;
    provider?: string;
    authenticatedAt?: number;
    isDemo?: boolean;
  }
}
