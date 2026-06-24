import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { getAuthSession } from "./auth";
import { prisma } from "./prisma";
import { TENANT_PLAN_LIMITS, TenantLimits } from "./tenant-entitlements";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface TenantContext {
  tenantId: string;
  userId: string;
  role: string;
  tenantStatus?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core resolver — derive tenantId exclusively from the server session.
// NEVER call this with a client-supplied value.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolves the tenant context from the current server session.
 * Returns null if the user is unauthenticated or has no tenant assigned.
 * SUPERADMIN users may legitimately have no tenantId (they manage all tenants).
 */
export async function getTenantContext(): Promise<TenantContext | null> {
  const session = await getAuthSession();
  if (!session?.user?.id) return null;

  const { id: userId, role, tenantId, tenantStatus } = session.user as {
    id: string;
    role: string;
    tenantId?: string;
    tenantStatus?: string;
  };

  // SUPERADMIN may operate without a tenantId
  if (role === "SUPERADMIN") {
    return { tenantId: tenantId ?? "", userId, role, tenantStatus };
  }

  if (!tenantId) return null;

  return { tenantId, userId, role, tenantStatus };
}

/**
 * Resolves tenant context from a pre-fetched session object.
 * Use this when you already have the session to avoid a double DB hit.
 */
export function getTenantContextFromSession(
  session: Session | null
): TenantContext | null {
  if (!session?.user?.id) return null;

  const user = session.user as {
    id: string;
    role: string;
    tenantId?: string;
    tenantStatus?: string;
  };

  if (user.role === "SUPERADMIN") {
    return { tenantId: user.tenantId ?? "", userId: user.id, role: user.role, tenantStatus: user.tenantStatus };
  }

  if (!user.tenantId) return null;

  return { tenantId: user.tenantId, userId: user.id, role: user.role, tenantStatus: user.tenantStatus };
}

// ─────────────────────────────────────────────────────────────────────────────
// Role assertion helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Asserts that the user's role is one of the allowed roles.
 * Returns a 403 NextResponse if the check fails, otherwise null.
 */
export function requireRole(
  ctx: TenantContext | null,
  allowedRoles: string[]
): NextResponse | null {
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Globally block non-APPROVED tenants from APIs unless SUPERADMIN
  if (ctx.role !== "SUPERADMIN" && ctx.tenantStatus !== "APPROVED") {
    return NextResponse.json({ error: "Tenant is not approved for API access." }, { status: 403 });
  }

  if (!allowedRoles.includes(ctx.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

/** Requires ADMIN or SUPERADMIN role. */
export function requireAdmin(ctx: TenantContext | null): NextResponse | null {
  return requireRole(ctx, ["ADMIN", "SUPERADMIN"]);
}

/** Requires TRAINER, ADMIN, or SUPERADMIN role. */
export function requireTrainer(ctx: TenantContext | null): NextResponse | null {
  return requireRole(ctx, ["TRAINER", "ADMIN", "SUPERADMIN"]);
}

/** Requires SUPERADMIN role only. */
export function requireSuperAdmin(
  ctx: TenantContext | null
): NextResponse | null {
  return requireRole(ctx, ["SUPERADMIN"]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Tenant ownership assertion
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Asserts that the resolved tenantId matches an expected tenantId.
 * Use this when verifying a resource belongs to the caller's tenant.
 * Returns a 403 NextResponse if they don't match.
 */
export function assertTenantOwner(
  ctx: TenantContext | null,
  resourceTenantId: string
): NextResponse | null {
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // SUPERADMIN can access any tenant
  if (ctx.role === "SUPERADMIN") return null;

  // Globally block non-APPROVED tenants from APIs
  if (ctx.tenantStatus !== "APPROVED") {
    return NextResponse.json({ error: "Tenant is not approved for API access." }, { status: 403 });
  }

  if (ctx.tenantId !== resourceTenantId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

/**
 * Asserts that the specified tenant is APPROVED.
 * Blocks API access if the tenant is PENDING, SUSPENDED, or REJECTED.
 * SUPERADMIN bypasses this check.
 */
export async function assertTenantApproved(
  ctx: TenantContext | null,
  tenantId: string
): Promise<NextResponse | null> {
  if (!ctx) return unauthorized();
  if (ctx.role === "SUPERADMIN") return null;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { status: true }
  });

  if (!tenant || tenant.status !== "APPROVED") {
    return NextResponse.json(
      { error: "Tenant is not approved for API access." }, 
      { status: 403 }
    );
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hardened Cross-Tenant & RBAC Assertions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Asserts that the specified member belongs to the caller's tenant.
 * Returns a 403 NextResponse if they don't match, or null if successful.
 */
export async function assertMemberBelongsToTenant(
  ctx: TenantContext | null,
  memberId: string
): Promise<NextResponse | null> {
  if (!ctx) return unauthorized();
  if (ctx.role !== "SUPERADMIN" && ctx.tenantStatus !== "APPROVED") {
    return NextResponse.json({ error: "Tenant is not approved for API access." }, { status: 403 });
  }

  const memberProfile = await prisma.memberProfile.findUnique({
    where: { id: memberId },
    select: { user: { select: { tenantId: true } } },
  });

  if (!memberProfile) return forbidden();

  if (ctx.role !== "SUPERADMIN" && memberProfile.user.tenantId !== ctx.tenantId) {
    return forbidden();
  }

  return null;
}

/**
 * Asserts that the specified trainer belongs to the caller's tenant.
 */
export async function assertTrainerBelongsToTenant(
  ctx: TenantContext | null,
  trainerId: string
): Promise<NextResponse | null> {
  if (!ctx) return unauthorized();
  if (ctx.role !== "SUPERADMIN" && ctx.tenantStatus !== "APPROVED") {
    return NextResponse.json({ error: "Tenant is not approved for API access." }, { status: 403 });
  }

  const trainerProfile = await prisma.trainerProfile.findUnique({
    where: { id: trainerId },
    select: { user: { select: { tenantId: true } } },
  });

  if (!trainerProfile) return forbidden();

  if (ctx.role !== "SUPERADMIN" && trainerProfile.user.tenantId !== ctx.tenantId) {
    return forbidden();
  }

  return null;
}

/**
 * Asserts that the specified plan belongs to the caller's tenant.
 */
export async function assertPlanBelongsToTenant(
  ctx: TenantContext | null,
  planId: string
): Promise<NextResponse | null> {
  if (!ctx) return unauthorized();
  if (ctx.role !== "SUPERADMIN" && ctx.tenantStatus !== "APPROVED") {
    return NextResponse.json({ error: "Tenant is not approved for API access." }, { status: 403 });
  }

  const plan = await prisma.membershipPlan.findUnique({
    where: { id: planId },
    select: { tenantId: true },
  });

  if (!plan) return forbidden();

  if (ctx.role !== "SUPERADMIN" && plan.tenantId !== ctx.tenantId) {
    return forbidden();
  }

  return null;
}

/**
 * Complex RBAC: Can the caller manage the target member?
 * - MEMBER: Can only manage themselves.
 * - TRAINER/ADMIN/SUPERADMIN: Can manage any member within their tenant context.
 */
export async function assertUserCanManageMember(
  ctx: TenantContext | null,
  memberId: string
): Promise<NextResponse | null> {
  if (!ctx) return unauthorized();
  if (ctx.role !== "SUPERADMIN" && ctx.tenantStatus !== "APPROVED") {
    return NextResponse.json({ error: "Tenant is not approved for API access." }, { status: 403 });
  }

  const memberProfile = await prisma.memberProfile.findUnique({
    where: { id: memberId },
    select: { userId: true, user: { select: { tenantId: true } } },
  });

  if (!memberProfile) return forbidden();

  if (ctx.role === "MEMBER") {
    // A member can only ever manage their own profile
    if (memberProfile.userId !== ctx.userId) return forbidden();
  } else if (ctx.role === "SUPERADMIN") {
    return null; // Superadmin has universal access
  } else {
    // TRAINER or ADMIN can manage members within their own gym
    if (memberProfile.user.tenantId !== ctx.tenantId) return forbidden();
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Standard 401 / 403 helpers
// ─────────────────────────────────────────────────────────────────────────────

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden(): NextResponse {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export function noTenantContext(): NextResponse {
  return NextResponse.json(
    { error: "No tenant context. Please complete onboarding." },
    { status: 403 }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 10: Domain Resolution Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalizes a custom domain by trimming whitespace and converting to lowercase.
 * Must be used before storing or querying any domain.
 */
export function normalizeDomain(domain: string): string {
  return domain.trim().toLowerCase();
}

/**
 * Resolves a tenant by their verified custom domain.
 * Used exclusively by the Middleware and Host Header verification.
 */
export async function getTenantByCustomDomain(domain: string) {
  const normalized = normalizeDomain(domain);
  
  return prisma.tenantSettings.findFirst({
    where: { 
      customDomain: normalized, 
      domainVerified: true 
    },
    select: { tenantId: true, tenant: { select: { slug: true, isActive: true } } },
  });
}

/**
 * Retrieves full tenant settings, including DNS verification states.
 */
export async function getTenantSettings(tenantId: string) {
  return prisma.tenantSettings.findUnique({
    where: { tenantId },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 20: Tenant SaaS Entitlement Enforcement
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Asserts that the given tenant is allowed to use a specific feature or has not
 * exceeded a numeric threshold, based on their active SaaS plan.
 */
export async function verifyTenantEntitlement(
  tenantId: string,
  feature: keyof TenantLimits
): Promise<NextResponse | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true }
  });

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const limits = TENANT_PLAN_LIMITS[tenant.plan];

  // Boolean Feature Check
  if (typeof limits[feature] === "boolean") {
    if (!limits[feature]) {
      return NextResponse.json(
        { error: `This feature is locked on the ${tenant.plan} plan. Please upgrade.` },
        { status: 403 }
      );
    }
    return null;
  }

  // Threshold / Numeric Check
  if (typeof limits[feature] === "number") {
    const limit = limits[feature] as number;
    
    let currentCount = 0;
    if (feature === "maxMembers") {
      currentCount = await prisma.memberProfile.count({
        where: { user: { tenantId } }
      });
    } else if (feature === "maxTrainers") {
      currentCount = await prisma.trainerProfile.count({
        where: { user: { tenantId } }
      });
    }

    if (currentCount >= limit) {
      return NextResponse.json(
        { error: `Limit exceeded. Your ${tenant.plan} plan allows up to ${limit} ${feature === "maxMembers" ? "members" : "trainers"}. Please upgrade.` },
        { status: 403 }
      );
    }
    return null;
  }

  return null;
}
