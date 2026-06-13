import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantContextFromSession, noTenantContext } from "@/lib/tenant";
import { checkAiRateLimit } from "@/lib/ratelimit";
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

    // ✅ tenantId from session
    const ctx = getTenantContextFromSession(session);
    if (!ctx?.tenantId) return noTenantContext();

    // ✅ Phase 9B.4: SaaS AI Quota Enforcement
    const quota = await checkAiQuota(ctx.tenantId);
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.reason }, { status: 403 });
    }

    const { memberId, fitnessLevel, daysPerWeek, equipment, focusArea, goals } =
      await req.json();

    const prompt = `Generate a ${daysPerWeek}-day per week workout plan for a gym member with these details:
- Fitness level: ${fitnessLevel}
- Focus area: ${focusArea}
- Available equipment: ${equipment}
- Goals: ${goals}

Create a structured weekly workout plan. For each training day provide:
- Day name (e.g. Monday)
- 4-6 exercises with sets, reps, and rest time

Respond ONLY with a valid JSON object in this exact format (no markdown, no explanation):
{
  "title": "plan title",
  "weeklyPlan": [
    {
      "day": "Monday",
      "focus": "e.g. Upper Body",
      "exercises": [
        { "name": "exercise name", "sets": 3, "reps": "10-12", "rest": "60s", "notes": "optional tip" }
      ]
    }
  ],
  "tips": ["tip1", "tip2", "tip3"]
}`;

    // ── Gemini JSON generation ────────────────────────────────────────────────
    let plan: Record<string, unknown>;
    let inputTokens: number | null = null;
    let outputTokens: number | null = null;

    try {
      const result = await generateJSON<Record<string, unknown>>(prompt, {
        maxOutputTokens: 2048,
      });
      plan = result.data;
      inputTokens = result.inputTokens;
      outputTokens = result.outputTokens;
    } catch (parseErr) {
      console.error("[ai/workout] JSON parse error:", parseErr);
      // Log failed call
      prisma.aiLog
        .create({
          data: {
            tenantId: ctx.tenantId,
            userId: session.user.id,
            feature: "WORKOUT",
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

    // Save to database if memberId provided
    if (memberId) {
      const routines = (plan.weeklyPlan as any[]).map((day: any) => ({
        day: day.day,
        exercises: day.exercises.map((ex: any) => ({
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          rest: ex.rest,
        })),
      }));

      await prisma.workoutPlan.create({
        data: {
          memberId,
          tenantId: ctx.tenantId, // ✅ from session
          title: plan.title as string,
          routines,
          isAiGenerated: true,
        },
      });
    }

    // ✅ Phase 8: Fire-and-forget AI usage log
    prisma.aiLog
      .create({
        data: {
          tenantId: ctx.tenantId,
          userId: session.user.id,
          feature: "WORKOUT",
          model: GEMINI_MODEL,
          inputTokens,
          outputTokens,
          success: true,
        },
      })
      .catch(() => {});

    return NextResponse.json(plan);
  } catch (err) {
    console.error("[ai/workout]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
