import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enqueueEmail } from "@/lib/email/emailQueue";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawEmail = body.email;

    if (!rawEmail || typeof rawEmail !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const email = rawEmail.trim().toLowerCase();

    // Basic regex email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Upsert into NewsletterSubscriber for idempotency
    const subscriber = await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: { status: "SUBSCRIBED" }, // If they resubscribe
      create: { email, status: "SUBSCRIBED" },
    });

    // Enqueue the welcome email job
    // The email processor will automatically deduplicate based on this eventId.
    const eventId = `newsletter:welcome:v1:${email}`;
    
    await enqueueEmail({
      emailType: "NEWSLETTER_WELCOME",
      recipient: email,
      subject: "Welcome to CortexFit! 🚀",
      eventId,
      payload: {
        subscriberEmail: email,
      },
    });

    return NextResponse.json({ success: true, message: "Subscribed successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("[Newsletter API] Error:", error.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
