import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { getTenantContextFromSession, noTenantContext } from "@/lib/tenant";
import { checkAiRateLimit } from "@/lib/ratelimit";
import { prisma } from "@/lib/prisma";
import { generateJSON, GEMINI_MODEL } from "@/lib/gemini";
import { checkAiQuota } from "@/lib/enforcement";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Phase 8: Rate limiting
    const rl = await checkAiRateLimit(session.user.id);
    if (rl.limited) return rl.response!;

    // ✅ Phase 4: tenantId context
    const ctx = getTenantContextFromSession(session);
    if (!ctx?.tenantId) return noTenantContext();

    // ✅ Phase 9B.4: SaaS AI Quota Enforcement
    const quota = await checkAiQuota(ctx.tenantId);
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.reason }, { status: 403 });
    }

    const {
      progressRecords,
      totalAttendance,
      totalWorkouts,
      fitnessGoals,
      weightKg,
      heightCm,
    } = await req.json();

    if (!progressRecords || progressRecords.length === 0) {
      return NextResponse.json(
        {
          error:
            "No progress records found. Ask your trainer to record your measurements first.",
        },
        { status: 400 }
      );
    }

    const recordsSummary = progressRecords
      .map(
        (
          r: {
            recordedAt: string;
            weightKg?: number;
            bodyFatPct?: number;
            muscleMass?: number;
            waistCm?: number;
          },
          i: number
        ) => `Record ${i + 1} (${new Date(r.recordedAt).toLocaleDateString("en-NG", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}):
- Weight: ${r.weightKg ?? "N/A"}kg
- Body Fat: ${r.bodyFatPct ?? "N/A"}%
- Muscle Mass: ${r.muscleMass ?? "N/A"}kg
- Waist: ${r.waistCm ?? "N/A"}cm`
      )
      .join("\n\n");

    const prompt = `Analyze this gym member's fitness progress and provide detailed insights:

Member profile:
- Current weight: ${weightKg ?? "unknown"}kg
- Height: ${heightCm ?? "unknown"}cm
- Fitness goals: ${fitnessGoals?.join(", ") || "general fitness"}
- Total gym visits: ${totalAttendance}
- Total workout plans: ${totalWorkouts}

Progress records (chronological):
${recordsSummary}

Provide a comprehensive analysis. Respond ONLY with valid JSON (no markdown, no explanation):
{
  "summary": "2-3 sentence overall assessment",
  "trends": [
    { "metric": "metric name", "direction": "improving/declining/stable", "change": "e.g. -2.5kg", "insight": "what this means" }
  ],
  "achievements": ["achievement 1", "achievement 2"],
  "concerns": ["concern if any"],
  "recommendations": [
    { "category": "Workout/Nutrition/Recovery/Lifestyle", "action": "specific action", "priority": "high/medium/low" }
  ],
  "nextGoals": ["goal 1", "goal 2"],
  "motivationalMessage": "personalised encouraging message"
}`;

    // ── Gemini JSON generation ────────────────────────────────────────────────
    let analysis: Record<string, unknown>;
    let inputTokens: number | null = null;
    let outputTokens: number | null = null;

    try {
      const result = await generateJSON<Record<string, unknown>>(prompt, {
        maxOutputTokens: 1536,
      });
      analysis = result.data;
      inputTokens = result.inputTokens;
      outputTokens = result.outputTokens;
    } catch (parseErr) {
      console.error("[ai/progress] JSON parse error:", parseErr);
      prisma.aiLog
        .create({
          data: {
            tenantId: ctx.tenantId,
            userId: session.user.id,
            feature: "PROGRESS",
            model: GEMINI_MODEL,
            inputTokens,
            outputTokens,
            success: false,
          },
        })
        .catch(() => {});
      return NextResponse.json(
        { error: "AI response could not be parsed. Please try again." },
        { status: 500 }
      );
    }

    // ✅ Phase 8: Fire-and-forget AI usage log
    prisma.aiLog
      .create({
        data: {
          tenantId: ctx.tenantId,
          userId: session.user.id,
          feature: "PROGRESS",
          model: GEMINI_MODEL,
          inputTokens,
          outputTokens,
          success: true,
        },
      })
      .catch(() => {});

    return NextResponse.json(analysis);
  } catch (err) {
    console.error("[ai/progress]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
