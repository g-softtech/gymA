import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { getTenantContextFromSession, noTenantContext } from "@/lib/tenant";

// POST — join challenge or update progress
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Phase 4: tenantId from session
    const ctx = getTenantContextFromSession(session);
    if (!ctx?.tenantId) return noTenantContext();

    const { challengeId } = await params;
    const { progress } = await req.json();

    const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    // ✅ Cross-tenant guard — challenge must belong to caller's tenant
    if (challenge.tenantId !== ctx.tenantId) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    const newProgress = parseInt(progress) || 0;
    const completed = newProgress >= challenge.goal;

    const entry = await prisma.challengeEntry.upsert({
      where: { challengeId_userId: { challengeId, userId: session.user.id } },
      update: { progress: newProgress, completed },
      create: {
        challengeId,
        userId: session.user.id,
        progress: newProgress,
        completed,
      },
    });

    // Award badge if challenge completed
    if (completed) {
      await prisma.badge.upsert({
        where: { userId_type: { userId: session.user.id, type: "CHALLENGE_COMPLETE" } },
        update: {},
        create: { userId: session.user.id, type: "CHALLENGE_COMPLETE" },
      });
    }

    return NextResponse.json(entry);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
