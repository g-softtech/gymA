import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages, systemContext } = await req.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "Messages required" }, { status: 400 });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemContext,
        messages: messages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    const data = await response.json();
    const reply = data.content?.[0]?.text ?? "Sorry, I could not generate a response. Please try again.";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
