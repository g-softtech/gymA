import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("cortexfit_sandbox_session")?.value;

    if (!sessionId) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const deltaSeconds = typeof body.deltaSeconds === 'number' ? body.deltaSeconds : 0;
    
    if (deltaSeconds <= 0 || deltaSeconds > 120) {
      return NextResponse.json({ success: true }); // Ignore invalid deltas but don't error
    }

    // Find the action registry entry for this session using string contains 
    // since the context field is typed as String in Prisma.
    // Safe because sessionId is a crypto.randomUUID().
    const records = await prisma.actionRegistry.findMany({
      where: {
        actionType: "SANDBOX_PORTAL_VISIT",
        context: {
          contains: sessionId
        }
      },
      orderBy: { executedAt: 'desc' },
      take: 1
    });

    if (records.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const record = records[0];
    let context;
    try {
      context = JSON.parse(record.context);
    } catch (e) {
      return NextResponse.json({ error: "Invalid session context" }, { status: 500 });
    }
    
    // Verify it's actually the correct session (preventing partial UUID match edge cases)
    if (context.sessionId !== sessionId) {
      return NextResponse.json({ error: "Session mismatch" }, { status: 401 });
    }

    context.durationSeconds = (context.durationSeconds || 0) + deltaSeconds;
    context.lastHeartbeatAt = new Date().toISOString();

    await prisma.actionRegistry.update({
      where: { id: record.id },
      data: { 
        context: JSON.stringify(context)
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SANDBOX_HEARTBEAT_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
