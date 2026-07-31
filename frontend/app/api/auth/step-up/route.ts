import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enqueueEmail } from "@/lib/email/emailQueue";
import { createVerificationToken } from "@/lib/auth-tokens";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, returnUrl } = await req.json();

    if (!action || !returnUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create the challenge in the DB (expires in 15 minutes)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const challenge = await prisma.stepUpChallenge.create({
      data: {
        userId: session.user.id,
        action,
        returnUrl,
        expiresAt,
      },
    });

    // The callbackUrl the user lands on AFTER NextAuth verifies them
    const verifyCallbackUrl = `${process.env.NEXTAUTH_URL}/auth/verify?challenge=${challenge.id}`;

    // Create a fresh NextAuth verification token
    const token = await createVerificationToken(session.user.email, verifyCallbackUrl);
    const magicUrl = `${process.env.NEXTAUTH_URL}/api/auth/callback/email?callbackUrl=${encodeURIComponent(verifyCallbackUrl)}&token=${token}&email=${encodeURIComponent(session.user.email)}`;

    // Send the email
    await enqueueEmail({
      emailType: "MAGIC_LINK",
      recipient: session.user.email,
      subject: "Security Verification — CortexFit",
      tenantId: session.user.tenantId, // For branding if they are in a gym
      userId: session.user.id,
      payload: {
        recipientName: session.user.name || "User",
        magicUrl,
        gymName: session.user.tenantSlug ? "your gym" : undefined,
      },
    });

    return NextResponse.json({ success: true, challengeId: challenge.id });
  } catch (error) {
    console.error("[POST /api/auth/step-up]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
