import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);

    const attempts = await prisma.authRateLimit.count({
      where: {
        email: email.toLowerCase(),
        createdAt: { gte: fifteenMinsAgo }
      }
    });

    if (attempts >= 5) {
      return NextResponse.json({ error: "Too many login attempts. Please wait 15 minutes before trying again." }, { status: 429 });
    }

    await prisma.authRateLimit.create({
      data: {
        email: email.toLowerCase(),
        ip: req.headers.get("x-forwarded-for") || "unknown"
      }
    });

    // Fire and forget cleanup of old records to prevent table bloat
    prisma.authRateLimit.deleteMany({
      where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Rate limit error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
