import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { progressRecords, totalAttendance, totalWorkouts, fitnessGoals, weightKg, heightCm } =
      await req.json();

    if (!progressRecords || progressRecords.length === 0) {
      return NextResponse.json({
        error: "No progress records found. Ask your trainer to record your measurements first.",
      }, { status: 400 });
    }

    const prompt = `Analyze this gym member's fitness progress and provide detailed insights:

Member profile:
- Current weight: ${weightKg ?? "unknown"}kg
- Height: ${heightCm ?? "unknown"}cm
- Fitness goals: ${fitnessGoals?.join(", ") || "general fitness"}
- Total gym visits: ${totalAttendance}
- Total workout plans: ${totalWorkouts}

Progress records (chronological):
${progressRecords.map((r: any, i: number) => `
Record ${i + 1} (${new Date(r.recordedAt).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}):
- Weight: ${r.weightKg ?? "N/A"}kg
- Body Fat: ${r.bodyFatPct ?? "N/A"}%
- Muscle Mass: ${r.muscleMass ?? "N/A"}kg
- Waist: ${r.waistCm ?? "N/A"}cm
`).join("")}

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
      headers: { "Content-Type": "application/json" },
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
      return NextResponse.json({ error: "AI response could not be parsed. Please try again." }, { status: 500 });
    }

    return NextResponse.json(analysis);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
