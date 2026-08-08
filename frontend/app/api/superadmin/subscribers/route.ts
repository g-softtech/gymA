import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { getTenantContextFromSession, requireSuperAdmin } from "@/lib/tenant";

export async function GET(request: Request) {
  try {
    const session = await getAuthSession();
    const ctx = getTenantContextFromSession(session);
    const authError = requireSuperAdmin(ctx);
    if (authError) return authError;

    const subscribers = await prisma.newsletterSubscriber.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ subscribers });
  } catch (error: any) {
    console.error("[Superadmin Subscribers API] Error fetching subscribers:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscribers." },
      { status: 500 }
    );
  }
}
