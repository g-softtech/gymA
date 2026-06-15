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
  const TRACE = `[FORENSIC:access-control][${Date.now()}]`;

  // ── FORENSIC: log raw session inputs ────────────────────────────────────
  console.log(`${TRACE} ┌─ ENTRY`);
  console.log(`${TRACE} │  session?.user?.id        = ${session?.user?.id ?? "undefined — no session"}`);
  console.log(`${TRACE} │  session.user.role        = ${(session?.user as any)?.role ?? "undefined"}`);
  console.log(`${TRACE} │  session.user.tenantId    = ${(session?.user as any)?.tenantId ?? "undefined"}`);
  console.log(`${TRACE} │  session.user.tenantSlug  = ${(session?.user as any)?.tenantSlug ?? "undefined"}`);
  console.log(`${TRACE} │  session.user.email       = ${session?.user?.email ?? "undefined"}`);

  if (!session?.user?.id) {
    const result = {
      role: "GUEST",
      hasTenant: false,
      tenantId: null,
      tenantSlug: null,
      defaultRedirect: "/api/auth/signin?callbackUrl=/dashboard",
    };
    console.log(`${TRACE} └─ BRANCH: no session → GUEST → redirect=${result.defaultRedirect}`);
    return result;
  }

  const role = session.user.role || "MEMBER";
  const tenantId = session.user.tenantId || null;
  const tenantSlug = session.user.tenantSlug || null;

  // Rule 1: Existence of tenant relies on tenantId.
  const hasTenant = !!tenantId;

  console.log(`${TRACE} │  computed: role=${role} tenantId=${tenantId ?? "null"} tenantSlug=${tenantSlug ?? "null"} hasTenant=${hasTenant}`);

  // SUPERADMIN bypasses tenant rules.
  if (role === "SUPERADMIN") {
    const result = { role, hasTenant, tenantId, tenantSlug, defaultRedirect: "/admin" };
    console.log(`${TRACE} └─ BRANCH: SUPERADMIN → redirect=${result.defaultRedirect}`);
    return result;
  }

  // Self-Healing Guard: Data corruption detection
  if (hasTenant && !tenantSlug) {
    console.warn(`${TRACE} └─ ⚠️  BRANCH: SELF-HEALING GUARD FIRED`);
    console.warn(`${TRACE}    tenantId="${tenantId}" is SET but tenantSlug is NULL`);
    console.warn(`${TRACE}    Demoting hasTenant → false, redirect → /onboarding`);
    console.warn(`${TRACE}    user.id=${session.user.id} user.email=${session.user.email}`);
    return {
      role,
      hasTenant: false,
      tenantId: null,
      tenantSlug: null,
      defaultRedirect: "/onboarding",
    };
  }

  // Tenant-Bound Routing
  if (hasTenant) {
    const roleLower = role.toLowerCase();
    const safeSlug = tenantSlug ?? "unknown";
    const result = {
      role,
      hasTenant,
      tenantId,
      tenantSlug,
      defaultRedirect: `/gym/${safeSlug}/dashboard/${roleLower}`,
    };
    console.log(`${TRACE} └─ BRANCH: tenant-bound → redirect=${result.defaultRedirect}`);
    return result;
  }

  // No valid tenant -> Onboarding
  const result = {
    role,
    hasTenant: false,
    tenantId: null,
    tenantSlug: null,
    defaultRedirect: "/onboarding",
  };
  console.log(`${TRACE} └─ BRANCH: no tenant → redirect=${result.defaultRedirect}`);
  return result;
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
