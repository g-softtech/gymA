import { NextRequest, NextResponse } from "next/server";
export const maxDuration = 60;
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantContextFromSession, noTenantContext } from "@/lib/tenant";
import { checkAiRateLimit } from "@/lib/ratelimit";
import { generateJSON, GEMINI_MODEL } from "@/lib/gemini";
import { checkAiQuota } from "@/lib/enforcement";
import { checkEntitlement } from "@/lib/entitlements/check-entitlement";

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

    const entAccess = await checkEntitlement(session.user.id, "AI_ACCESS");
    if (!entAccess.allowed) return NextResponse.json({ error: entAccess.reason }, { status: 403 });

    const entLimit = await checkEntitlement(session.user.id, "MAX_AI_REQUESTS");
    if (!entLimit.allowed) return NextResponse.json({ error: entLimit.reason }, { status: 403 });

    const { memberId, weightKg, heightCm, goal, activityLevel, allergies, preferences } =
      await req.json();

    // Calculate TDEE
    const bmr =
      weightKg && heightCm ? 10 * weightKg + 6.25 * heightCm - 5 * 25 + 5 : 2000;

    const activityMultipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };

    const tdee = Math.round(bmr * (activityMultipliers[activityLevel] ?? 1.55));
    const targetCalories =
      goal === "WEIGHT_LOSS"
        ? tdee - 500
        : goal === "MUSCLE_GAIN"
        ? tdee + 300
        : tdee;

    const prompt = `Create a personalised daily meal plan for a Nigerian gym member:
- Daily calorie target: ${targetCalories} kcal
- Goal: ${goal.replace(/_/g, " ")}
- Allergies/restrictions: ${allergies || "none"}
- Food preferences: ${preferences || "Nigerian foods preferred"}

IMPORTANT: Use Nigerian foods where possible (jollof rice, egusi soup, pounded yam, moin moin, suya, 
ogi, akara, efo riro, ogbono soup, eba, amala, zobo, kunu, plantain, groundnut soup, etc.)

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "title": "meal plan title",
  "totalCalories": ${targetCalories},
  "protein": 0,
  "carbs": 0,
  "fats": 0,
  "meals": [
    {
      "name": "Breakfast",
      "time": "7:00 AM",
      "foods": [
        { "name": "food name", "quantity": "amount", "calories": 0, "protein": 0, "carbs": 0, "fats": 0 }
      ]
    }
  ],
  "tips": ["tip1", "tip2"],
  "substitutions": [
    { "original": "food", "alternative": "alternative food", "reason": "why" }
  ]
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
      console.error("[ai/nutrition] JSON parse error:", parseErr);
      prisma.aiLog
        .create({
          data: {
            tenantId: ctx.tenantId,
            userId: session.user.id,
            feature: "NUTRITION",
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

    // Save to DB if memberId provided
    if (memberId) {
      await prisma.mealPlan.create({
        data: {
          memberId,
          tenantId: ctx.tenantId, // ✅ from session
          title: plan.title as string,
          goal: goal as any,
          totalCalories: plan.totalCalories as number,
          protein: plan.protein as number,
          carbs: plan.carbs as number,
          fats: plan.fats as number,
          meals: plan.meals as any,
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
          feature: "NUTRITION",
          model: GEMINI_MODEL,
          inputTokens,
          outputTokens,
          success: true,
        },
      })
      .catch(() => {});

    return NextResponse.json({ ...plan, targetCalories, tdee });
  } catch (err) {
    console.error("[ai/nutrition]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
