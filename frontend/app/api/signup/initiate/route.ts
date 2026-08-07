import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RESERVED_SLUGS } from "@/lib/tenant/reservedSlugs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ownerName, email, gymName, slug, phone, leadSource, demoPersona, attribution } = body;

    if (!ownerName || !email || !gymName || !slug) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Normalize slug: lowercase, trim, replace spaces/invalid chars with hyphens
    const normalizedSlug = slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (RESERVED_SLUGS.includes(normalizedSlug)) {
      return NextResponse.json({ error: "This workspace URL is reserved by the platform. Please choose another gym name." }, { status: 400 });
    }

    // 1. Check if a real Tenant already has this slug
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: normalizedSlug }
    });

    if (existingTenant) {
      return NextResponse.json({ error: "This workspace URL is already taken. Please choose another gym name." }, { status: 409 });
    }

    // 2. Check if the User already belongs to a gym
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser?.tenantId) {
      return NextResponse.json({ error: "This email is already associated with a gym workspace." }, { status: 409 });
    }

    // 3. Upsert the PendingSignup record
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Expires in 24 hours

    await prisma.pendingSignup.upsert({
      where: { email },
      update: {
        ownerName,
        gymName,
        slug: normalizedSlug,
        phone,
        leadSource: leadSource || "WEBSITE",
        demoPersona,
        attribution,
        status: "NEW",
        expiresAt,
        lastActivityAt: new Date()
      },
      create: {
        email,
        ownerName,
        gymName,
        slug: normalizedSlug,
        phone,
        leadSource: leadSource || "WEBSITE",
        demoPersona,
        attribution,
        status: "NEW",
        expiresAt,
        firstSeenAt: new Date(),
        lastActivityAt: new Date()
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Signup initiate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
