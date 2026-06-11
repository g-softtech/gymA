import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { getTenantContextFromSession, noTenantContext } from "@/lib/tenant";
import { checkAiRateLimit } from "@/lib/ratelimit";
import { prisma } from "@/lib/prisma";
import { generateChatReply, GEMINI_MODEL, type ChatMessage } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Phase 8: Rate limiting — 20 AI requests per user per hour
    const rl = await checkAiRateLimit(session.user.id);
    if (rl.limited) return rl.response!;

    // ✅ Phase 4: tenantId context
    const ctx = getTenantContextFromSession(session);
    if (!ctx?.tenantId) return noTenantContext();

    const { messages, systemContext } = await req.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "Messages required" }, { status: 400 });
    }

    // ── Gemini multi-turn chat ────────────────────────────────────────────────
    const { text: reply, inputTokens, outputTokens } = await generateChatReply(
      messages as ChatMessage[],
      systemContext
    );

    // ✅ Phase 8: Fire-and-forget AI usage log (non-blocking)
    prisma.aiLog
      .create({
        data: {
          tenantId: ctx.tenantId,
          userId: session.user.id,
          feature: "CHAT",
          model: GEMINI_MODEL,
          inputTokens,
          outputTokens,
          success: true,
        },
      })
      .catch(() => {}); // never throw — logging must not affect the response

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[ai/chat]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
