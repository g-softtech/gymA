import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import {
import { verifyWriteAccess } from "@/lib/sandbox/guard";
  getTenantContextFromSession,
  requireAdmin,
  noTenantContext,
} from "@/lib/tenant";

/**
 * GET /api/tenant/settings
 *
 * Two modes:
 *  1. Authenticated: returns TenantSettings for session.user.tenantId
 *  2. Public: GET /api/tenant/settings?slug=cortexfit — no auth required (for public gym pages)
 */
export async function GET(req: NextRequest) {
  try {
    const slugParam = req.nextUrl.searchParams.get("slug");

    // ─── Public mode: no auth required ─────────────────────────────────────
    if (slugParam) {
      const tenant = await prisma.tenant.findUnique({
        where: { slug: slugParam },
        select: { id: true, name: true, slug: true, plan: true, isActive: true },
      });
      if (!tenant) {
        return NextResponse.json({ error: "Gym not found" }, { status: 404 });
      }
      const settings = await prisma.tenantSettings.findUnique({
        where: { tenantId: tenant.id },
      });
      return NextResponse.json({ tenant, settings: settings ?? null });
    }

    // ─── Authenticated mode ─────────────────────────────────────────────────
    const session = await getAuthSession();
    if (session?.user?.tenantId) {
      await verifyWriteAccess(session.user.tenantId);
    }
    const ctx = getTenantContextFromSession(session);
    if (!ctx?.tenantId) return noTenantContext();

    const [tenant, settings] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: ctx.tenantId },
        select: { id: true, name: true, slug: true, plan: true, isActive: true },
      }),
      prisma.tenantSettings.findUnique({
        where: { tenantId: ctx.tenantId },
      }),
    ]);

    return NextResponse.json({ tenant, settings: settings ?? null });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/tenant/settings
 *
 * Upserts TenantSettings for the authenticated admin's tenant.
 * Body: { [fieldName]: value, ... } — any subset of TenantSettings fields.
 *
 * Special: passing `name` also updates Tenant.name.
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (session?.user?.tenantId) {
      await verifyWriteAccess(session.user.tenantId);
    }
    const ctx = getTenantContextFromSession(session);

    const roleErr = requireAdmin(ctx);
    if (roleErr) return roleErr;
    if (!ctx?.tenantId) return noTenantContext();

    const body = await req.json();
    const { name, ...settingsData } = body;

    // If gym name is being updated, update Tenant.name separately
    if (name && typeof name === "string") {
      await prisma.tenant.update({
        where: { id: ctx.tenantId },
        data: { name: name.trim() },
      });
    }

    // Upsert TenantSettings — creates on first save, updates on subsequent saves
    const settings = await prisma.tenantSettings.upsert({
      where: { tenantId: ctx.tenantId },
      update: settingsData,
      create: { tenantId: ctx.tenantId, ...settingsData },
    });

    try {
      const tenantRecord = await prisma.tenant.findUnique({ where: { id: ctx.tenantId }, select: { slug: true } });
      if (tenantRecord?.slug) {
        const { revalidatePath } = require("next/cache");
        revalidatePath(`/gym/${tenantRecord.slug}`);
        revalidatePath(`/gym/${tenantRecord.slug}/[...path]`, "layout");
      }
    } catch (e) {
      console.error("Failed to revalidate cache", e);
    }

    return NextResponse.json(settings);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
