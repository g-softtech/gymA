import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { name } = await req.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Gym name is required" },
        { status: 400 }
      );
    }

    // ✅ CLEAN SLUG (VERY IMPORTANT)
    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")   // safer than your current regex
      .replace(/(^-|-$)/g, "");      // remove leading/trailing hyphens

    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
      },
    });

    // ⚠️ IMPORTANT: ensure user exists first
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        tenantId: tenant.id,
      },
    });

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
    });

  } catch (error) {
    console.error("TENANT CREATE ERROR:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}