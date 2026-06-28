import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma, AdminNotificationType } from "@prisma/client";
import { logger } from "@/lib/logger";
import { BackgroundTaskRunner } from "@/lib/backgroundTaskRunner";
import { adminNotificationService } from "@/lib/notifications/AdminNotificationService";
import { NewTenantSignupPayload } from "@/lib/notifications/types";
import crypto from "crypto";
import { TRIAL_DURATION_DAYS } from "@/lib/billing/pricingConfig";
/**
 * POST /api/tenant/create
 *
 * Creates a new gym tenant and immediately:
 *   1. Sets the creator's role to ADMIN (was previously missing — critical bug fix)
 *   2. Creates a default TenantSettings record so the CMS editors never receive null
 *   3. Handles slug collisions gracefully (P2002 → 409 instead of 500)
 *   4. Dispatches an async notification to SuperAdmins.
 */
export async function POST(req: Request) {
  const correlationId = crypto.randomUUID();
  const logCtx = { correlationId };

  try {
    const session = await getAuthSession();

    logger.info("┌─ POST /api/tenant/create", { 
      ...logCtx, 
      sessionPresent: !!session?.user?.id,
      userId: session?.user?.id,
      userEmail: session?.user?.email 
    });

    if (!session?.user?.id || !session.user.email) {
      logger.warn("└─ DENY: no session", logCtx);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await req.json();

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Gym name must be at least 2 characters." },
        { status: 400 }
      );
    }

    // Derive a clean URL slug from the gym name
    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    if (!slug) {
      return NextResponse.json(
        { error: "Could not generate a valid URL from that name. Please use letters or numbers." },
        { status: 400 }
      );
    }

    // ── Atomic tenant creation + user promotion ──────────────────────────────
    // Use a transaction so the tenant row and user update either both succeed or both roll back.
    const { tenant } = await prisma.$transaction(async (tx) => {
      // Create the tenant with configured free trial
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DURATION_DAYS);
      
      const tenant = await tx.tenant.create({
        data: { 
          name: name.trim(), 
          slug,
          plan: "FREE",
          trialEndsAt,
          planStartedAt: new Date(),
        },
      });

      // ✅ FIX 1: Promote the creator to ADMIN of the new gym.
      await tx.user.update({
        where: { id: session.user!.id },
        data: {
          tenantId: tenant.id,
          role: "ADMIN",
        },
      });

      // ✅ FIX 2: Auto-create TenantSettings with sensible defaults
      await tx.tenantSettings.create({
        data: {
          tenantId: tenant.id,
          primaryColor: "#6366F1",
          secondaryColor: "#8B5CF6",
          accentColor: "#A78BFA",
          fontFamily: "Inter",
          darkMode: false,
          country: "Nigeria",
        },
      });

      return { tenant };
    });

    logger.info(`│  DB WRITE SUCCESS: tenant.id=${tenant.id} tenant.slug=${tenant.slug}`, logCtx);

    // ✅ FIX 4: Asynchronous Notification via WaitUntil
    const payload: NewTenantSignupPayload = {
      gymName: tenant.name,
      ownerName: session.user.name || "Unknown",
      ownerEmail: session.user.email,
      plan: tenant.plan, // Dynamically pulled from persisted tenant
      timestamp: new Date().toISOString(), // UTC ISO format
    };

    BackgroundTaskRunner.execute(
      "NewTenantAdminNotification",
      correlationId,
      async () => {
        await adminNotificationService.sendNotification(
          AdminNotificationType.NEW_TENANT_SIGNUP,
          payload,
          tenant.id,
          correlationId
        );
      }
    );

    logger.info(`└─ RESPONSE 201: returning slug=${tenant.slug} to client`, logCtx);

    return NextResponse.json(
      {
        success: true,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      logger.warn("A gym with a similar name already exists (Slug collision).", logCtx);
      return NextResponse.json(
        {
          error:
            "A gym with a similar name already exists on this platform. Please choose a different name.",
        },
        { status: 409 }
      );
    }

    logger.error("Internal Server Error in /api/tenant/create", error, logCtx);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}