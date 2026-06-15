import { Session } from "next-auth";

export type AccessContext = {
  role: string;
  hasTenant: boolean;
  tenantId: string | null;
  tenantSlug: string | null;
  defaultRedirect: string;
};

/**
 * Pure, synchronous access controller.
 * Computes all routing derivations entirely from the fully-hydrated NextAuth session.
 * NO database calls allowed here.
 */
export function getUserAccessContext(session: Session | null): AccessContext {
  if (!session?.user?.id) {
    return {
      role: "GUEST",
      hasTenant: false,
      tenantId: null,
      tenantSlug: null,
      defaultRedirect: "/api/auth/signin?callbackUrl=/dashboard",
    };
  }

  const role = session.user.role || "MEMBER";
  const tenantId = session.user.tenantId || null;
  const tenantSlug = session.user.tenantSlug || null;
  
  // Rule 1: Existence of tenant relies on tenantId.
  const hasTenant = !!tenantId;

  // SUPERADMIN bypasses tenant rules.
  if (role === "SUPERADMIN") {
    return { role, hasTenant, tenantId, tenantSlug, defaultRedirect: "/admin" };
  }

  // Self-Healing Guard (Fix 2): Data corruption detection
  if (hasTenant && !tenantSlug) {
    console.warn(`[ACCESS CONTROL WARNING] Data integrity issue for user ${session.user.id}: tenantId exists (${tenantId}) but tenantSlug is missing. Falling back to onboarding.`);
    return { 
      role, 
      hasTenant: false, 
      tenantId: null, 
      tenantSlug: null, 
      defaultRedirect: "/onboarding" 
    };
  }

  // Tenant-Bound Routing
  if (hasTenant) {
    const roleLower = role.toLowerCase();
    const safeSlug = tenantSlug ?? "unknown"; // Fallback safety (Fix 1)
    
    return {
      role,
      hasTenant,
      tenantId,
      tenantSlug,
      defaultRedirect: `/gym/${safeSlug}/dashboard/${roleLower}`,
    };
  }

  // No valid tenant -> Onboarding
  return { 
    role, 
    hasTenant: false, 
    tenantId: null, 
    tenantSlug: null, 
    defaultRedirect: "/onboarding" 
  };
}

/**
 * Helper to enforce page/layout guards using the central context.
 * If the user's default redirect does not match their current access zone,
 * or they violate a specific rule, this cleanly kicks them to their true home.
 */
export function enforceAccess(ctx: AccessContext, allowedRoles?: string[], requireTenant = false) {
  if (requireTenant && !ctx.hasTenant) return ctx.defaultRedirect;
  if (allowedRoles && !allowedRoles.includes(ctx.role)) return ctx.defaultRedirect;
  return null; // Allowed
}
