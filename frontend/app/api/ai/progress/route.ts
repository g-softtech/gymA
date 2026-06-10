import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { getTenantContextFromSession, noTenantContext } from "@/lib/tenant";
import { checkAiRateLimit } from "@/lib/ratelimit";
import { prisma } from "@/lib/prisma";

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

    const prompt = `Analyze this gym member's fitness progress and provide detailed insights:

Member profile:
- Current weight: ${weightKg ?? "unknown"}kg
- Height: ${heightCm ?? "unknown"}cm
- Fitness goals: ${fitnessGoals?.join(", ") || "general fitness"}
- Total gym visits: ${totalAttendance}
- Total workout plans: ${totalWorkouts}

Progress records (chronological):
${progressRecords
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
    ) => `
Record ${i + 1} (${new Date(r.recordedAt).toLocaleDateString("en-NG", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}):
- Weight: ${r.weightKg ?? "N/A"}kg
- Body Fat: ${r.bodyFatPct ?? "N/A"}%
- Muscle Mass: ${r.muscleMass ?? "N/A"}kg
- Waist: ${r.waistCm ?? "N/A"}cm
`
  )
  .join("")}

Provide a comprehensive analysis. Respond ONLY with valid JSON:
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

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text ?? "";

    let analysis;
    try {
      const clean = text.replace(/```json|```/g, "").trim();
      analysis = JSON.parse(clean);
    } catch {
      prisma.aiLog
        .create({
          data: {
            tenantId: ctx.tenantId,
            userId: session.user.id,
            feature: "PROGRESS",
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

    // ✅ Phase 8: Fire-and-forget AI usage log
    prisma.aiLog
      .create({
        data: {
          tenantId: ctx.tenantId,
          userId: session.user.id,
          feature: "PROGRESS",
          inputTokens: data.usage?.input_tokens ?? null,
          outputTokens: data.usage?.output_tokens ?? null,
          success: true,
        },
      })
      .catch(() => {});

    return NextResponse.json(analysis);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
