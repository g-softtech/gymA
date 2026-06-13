import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * POST /api/tenant/create
 *
 * Creates a new gym tenant and immediately:
 *   1. Sets the creator's role to ADMIN (was previously missing — critical bug fix)
 *   2. Creates a default TenantSettings record so the CMS editors never receive null
 *   3. Handles slug collisions gracefully (P2002 → 409 instead of 500)
 */
export async function POST(req: Request) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id || !session.user.email) {
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
      // Create the tenant with 14-day free trial
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);
      
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
      // Previously, tenantId was set but role stayed "MEMBER" — blocking dashboard access.
      await tx.user.update({
        where: { id: session.user!.id },
        data: {
          tenantId: tenant.id,
          role: "ADMIN",
        },
      });

      // ✅ FIX 2: Auto-create TenantSettings with sensible defaults so the CMS editors
      // never receive null on first load, and the public gym page renders something meaningful.
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
    // ✅ FIX 3: Catch unique-constraint violations (slug already taken) and return
    // a user-friendly 409 instead of a raw 500.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error:
            "A gym with a similar name already exists on this platform. Please choose a different name.",
        },
        { status: 409 }
      );
    }

    console.error("[POST /api/tenant/create]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}