import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enqueueEmail } from "@/lib/email/emailQueue";

/**
 * POST /api/contact
 *
 * Handles the public contact form submitted from a gym's public website.
 * No authentication required.
 *
 * Body:
 *   - slug: string       — the gym's tenant slug (identifies which gym)
 *   - name: string
 *   - email: string
 *   - phone?: string
 *   - message: string
 *   - subject?: string
 *
 * Behaviour:
 *   1. Validates inputs
 *   2. Looks up the tenant from the slug
 *   3. Creates an internal Notification of type GENERAL targeted at the
 *      gym's admin (no userId → all admins of that tenant see it in the
 *      notification center)
 *   4. Returns success
 *
 * Future: integrate Resend/Nodemailer to email the gym owner directly.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, name, email, phone, message, subject, submissionId } = body;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!submissionId || typeof submissionId !== "string" || submissionId.length > 64) {
      return NextResponse.json({ error: "Invalid submission ID" }, { status: 400 });
    }

    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "Gym slug is required" }, { status: 400 });
    }

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    if (name.trim().length > 100) {
      return NextResponse.json({ error: "Name is too long" }, { status: 400 });
    }

    if (subject && subject.trim().length > 150) {
      return NextResponse.json({ error: "Subject is too long" }, { status: 400 });
    }

    if (phone && phone.trim().length > 30) {
      return NextResponse.json({ error: "Phone number is too long" }, { status: 400 });
    }

    if (message.trim().length < 10) {
      return NextResponse.json({ error: "Message is too short" }, { status: 400 });
    }

    if (message.trim().length > 5000) {
      return NextResponse.json({ error: "Message is too long" }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    // ── Resolve tenant ────────────────────────────────────────────────────────
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, name: true, isActive: true, settings: true },
    });

    if (!tenant || !tenant.isActive) {
      return NextResponse.json({ error: "Gym not found" }, { status: 404 });
    }

    // ── Create internal notification for the gym admin(s) ─────────────────────
    const notificationTitle = `📩 Contact Form: ${subject?.trim() || "New Enquiry"} from ${name.trim()}`;
    const notificationMessage = [
      `Name: ${name.trim()}`,
      `Email: ${email.trim()}`,
      phone ? `Phone: ${phone.trim()}` : null,
      ``,
      message.trim(),
    ].filter((l) => l !== null).join("\n");

    // Deduplicate the notification: Check if this exact notification was created in the last 5 mins
    const recentNotification = await prisma.notification.findFirst({
      where: {
        tenantId: tenant.id,
        title: notificationTitle,
        message: notificationMessage,
        createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) }
      },
    });

    if (!recentNotification) {
      await prisma.notification.create({
        data: {
          tenantId: tenant.id,
          userId: null, // broadcast to all admins of this tenant
          type: "GENERAL",
          title: notificationTitle,
          message: notificationMessage,
        },
      });
    }

    // ── Send Email to Gym Owner ───────────────────────────────────────────────
    // If the gym has configured a contact email in their settings, enqueue an email!
    const gymEmail = (tenant.settings as any)?.email;
    if (gymEmail && typeof gymEmail === "string") {
      // Use client submissionId for idempotency, now strictly required
      const eventId = `contact:tenant:${tenant.id}:${submissionId.trim()}`;

      await enqueueEmail({
        eventId,
        emailType: "TENANT_CONTACT",
        recipient: gymEmail,
        subject: `📩 Website Enquiry: ${subject?.trim() || "New Message"} from ${name}`,
        payload: {
          name: name.trim(),
          email: email.trim(),
          phone: phone ? phone.trim().substring(0, 50) : undefined,
          subject: subject?.trim() || "New Message",
          message: message.trim(),
          tenantName: tenant.name,
        },
        tenantId: tenant.id,
        userId: undefined,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[contact] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
