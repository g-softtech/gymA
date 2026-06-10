import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantContextFromSession, noTenantContext } from "@/lib/tenant";
import { checkAiRateLimit } from "@/lib/ratelimit";

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

Respond ONLY with valid JSON in this exact format:
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

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text ?? "";

    let plan;
    try {
      const clean = text.replace(/```json|```/g, "").trim();
      plan = JSON.parse(clean);
    } catch {
      prisma.aiLog
        .create({
          data: {
            tenantId: ctx.tenantId,
            userId: session.user.id,
            feature: "NUTRITION",
            inputTokens: data.usage?.input_tokens ?? null,
            outputTokens: data.usage?.output_tokens ?? null,
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
          title: plan.title,
          goal: goal as any,
          totalCalories: plan.totalCalories,
          protein: plan.protein,
          carbs: plan.carbs,
          fats: plan.fats,
          meals: plan.meals,
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
          inputTokens: data.usage?.input_tokens ?? null,
          outputTokens: data.usage?.output_tokens ?? null,
          success: true,
        },
      })
      .catch(() => {});

    return NextResponse.json({ ...plan, targetCalories, tdee });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
