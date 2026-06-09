import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { getAuthSession } from "./auth";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface TenantContext {
  tenantId: string;
  userId: string;
  role: string;
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

  const { id: userId, role, tenantId } = session.user as {
    id: string;
    role: string;
    tenantId?: string;
  };

  // SUPERADMIN may operate without a tenantId
  if (role === "SUPERADMIN") {
    return { tenantId: tenantId ?? "", userId, role };
  }

  if (!tenantId) return null;

  return { tenantId, userId, role };
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
  };

  if (user.role === "SUPERADMIN") {
    return { tenantId: user.tenantId ?? "", userId: user.id, role: user.role };
  }

  if (!user.tenantId) return null;

  return { tenantId: user.tenantId, userId: user.id, role: user.role };
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
  if (ctx.tenantId !== resourceTenantId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
