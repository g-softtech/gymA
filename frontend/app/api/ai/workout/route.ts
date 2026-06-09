import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

Respond ONLY with a valid JSON object in this exact format:
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

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      return NextResponse.json({ error: "AI response could not be parsed. Please try again." }, { status: 500 });
    }

    // Save to database if memberId provided
    if (memberId) {
      const routines = plan.weeklyPlan.map((day: any) => ({
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
          title: plan.title,
          routines,
          isAiGenerated: true,
        },
      });
    }

    return NextResponse.json(plan);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
