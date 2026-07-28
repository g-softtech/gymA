import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ownerName, email, gymName, slug } = body;

    if (!ownerName || !email || !gymName || !slug) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Check if a real Tenant already has this slug
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug }
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
        slug,
        status: "PENDING",
        expiresAt,
      },
      create: {
        email,
        ownerName,
        gymName,
        slug,
        status: "PENDING",
        expiresAt,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Signup initiate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
