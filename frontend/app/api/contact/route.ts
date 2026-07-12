import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ResendEmailProvider } from "@/lib/notifications/providers/ResendEmailProvider";

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
    const { slug, name, email, phone, message, subject } = body;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "Gym slug is required" }, { status: 400 });
    }
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    if (message.trim().length < 10) {
      return NextResponse.json({ error: "Message is too short" }, { status: 400 });
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
    // userId is null — meaning all admins of this tenant will see it in their
    // notification center (the admin notification feed queries WHERE userId IS
    // NULL OR userId = adminId, so broadcast-style nulls work fine).
    await prisma.notification.create({
      data: {
        tenantId: tenant.id,
        userId: null, // broadcast to all admins of this tenant
        type: "GENERAL",
        title: `📩 Contact Form: ${subject?.trim() || "New Enquiry"} from ${name.trim()}`,
        message: [
          `Name: ${name.trim()}`,
          `Email: ${email.trim()}`,
          phone ? `Phone: ${phone.trim()}` : null,
          ``,
          message.trim(),
        ]
          .filter((l) => l !== null)
          .join("\n"),
      },
    });

    // ── Send Email to Gym Owner ───────────────────────────────────────────────
    // If the gym has configured a contact email in their settings, send it!
    const gymEmail = (tenant.settings as any)?.email;
    if (gymEmail && typeof gymEmail === "string") {
      try {
        const provider = new ResendEmailProvider();
        const htmlBody = `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
          <hr />
          <p>${message.replace(/\n/g, "<br/>")}</p>
        `;
        const textBody = `New Enquiry from ${name}\nEmail: ${email}\nPhone: ${phone || "N/A"}\n\nMessage:\n${message}`;
        
        await provider.sendEmail(
          [gymEmail],
          `📩 Website Enquiry: ${subject?.trim() || "New Message"} from ${name}`,
          htmlBody,
          textBody
        );
      } catch (emailErr) {
        // We log the error but don't fail the API request so the user still sees "Success"
        console.error("[contact] Failed to send email via Resend:", emailErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[contact] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
