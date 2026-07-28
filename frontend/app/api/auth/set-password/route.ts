import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { password } = await req.json();

    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Save password and increment session version to invalidate old tokens if needed
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        password: hashedPassword,
        sessionVersion: { increment: 1 }
      },
      select: { email: true, tenantId: true }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Set password error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
