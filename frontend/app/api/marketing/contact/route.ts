import { NextRequest, NextResponse } from "next/server";
import { enqueueEmail } from "@/lib/email/emailQueue";
import { CORTEXFIT_BRAND } from "@/lib/email/types";

/**
 * POST /api/marketing/contact
 * 
 * Handles public contact form submissions from the platform website.
 * No authentication required.
 * 
 * Body:
 *   - name: string
 *   - email: string
 *   - phone?: string
 *   - gymName?: string
 *   - subject: string
 *   - message: string
 *   - submissionId: string (client-generated idempotency key)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, gymName, subject, message, submissionId } = body;

    // ── Server-Side Validation ────────────────────────────────────────────────
    if (!submissionId || typeof submissionId !== "string" || submissionId.length > 64) {
      return NextResponse.json({ error: "Invalid submission ID" }, { status: 400 });
    }

    if (!name?.trim() || !email?.trim() || !message?.trim() || !subject?.trim()) {
      return NextResponse.json(
        { error: "Name, email, subject, and message are required" },
        { status: 400 }
      );
    }

    if (name.trim().length > 100) {
      return NextResponse.json({ error: "Name is too long" }, { status: 400 });
    }

    if (subject.trim().length > 150) {
      return NextResponse.json({ error: "Subject is too long" }, { status: 400 });
    }

    if (message.trim().length < 10) {
      return NextResponse.json({ error: "Message is too short" }, { status: 400 });
    }

    if (message.trim().length > 5000) {
      return NextResponse.json({ error: "Message is too long" }, { status: 400 });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: "Invalid email address format" }, { status: 400 });
    }

    // ── Idempotency Strategy ──────────────────────────────────────────────────
    // The client generates a unique `submissionId` per logical form submission attempt.
    // If they double-click the button or a network retry happens, the submissionId
    // remains the same. The EmailQueue (Prisma EmailJob) enforces uniqueness on eventId.
    // This perfectly prevents duplicate deliveries while allowing the same person to
    // submit a brand new enquiry later (which would have a new submissionId).
    const eventId = `contact:platform:${submissionId.trim()}`;

    // ── Enqueue Email ─────────────────────────────────────────────────────────
    await enqueueEmail({
      eventId,
      emailType: "PLATFORM_CONTACT",
      recipient: CORTEXFIT_BRAND.supportEmail, // Enforced securely on server
      subject: `Platform Enquiry: ${subject.trim()}`,
      payload: {
        name: name.trim(),
        email: email.trim(),
        phone: phone ? phone.trim().substring(0, 50) : undefined,
        gymName: gymName ? gymName.trim().substring(0, 100) : undefined,
        subject: subject.trim(),
        message: message.trim(),
        submittedAt: new Date().toLocaleString(),
      },
      tenantId: undefined, // Platform-level job
      userId: undefined,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    // Log diagnostics to server only, do not expose stack trace
    console.error("[PlatformContactAPI] Error processing submission:", err.message);
    
    // Check if it's a JSON parse error
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
