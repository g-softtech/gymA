import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createVerificationToken } from "@/lib/auth-tokens";
// Assuming an email sending library is configured, but we will mock the logging for now
import { auditLogger } from "@/lib/auditLogger";

export async function GET(req: Request) {
  try {
    // Ensure this is called via Vercel Cron or authorized request
    const authHeader = req.headers.get("authorization");
    if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const abandonedLeads = await prisma.pendingSignup.findMany({
      where: {
        status: { in: ["NEW", "MAGIC_LINK_SENT"] },
        createdAt: {
          lt: twentyFourHoursAgo,
          gte: fortyEightHoursAgo
        }
      }
    });

    let emailsSent = 0;

    for (const lead of abandonedLeads) {
      // 1. Generate fresh Magic Link
      const dashboardUrl = `${process.env.NEXTAUTH_URL}/gym/${lead.slug}/dashboard/admin`;
      const token = await createVerificationToken(lead.email, dashboardUrl);
      const magicUrl = `${process.env.NEXTAUTH_URL}/api/auth/callback/email?callbackUrl=${encodeURIComponent(dashboardUrl)}&token=${token}&email=${encodeURIComponent(lead.email)}`;

      // 2. Send "Still interested?" email
      // In a real implementation, we would call our email provider here (e.g. Resend, Sendgrid)
      console.log(`[CRON] Sending abandoned cart email to ${lead.email}: ${magicUrl}`);

      // 3. Update status and tracking
      await prisma.pendingSignup.update({
        where: { id: lead.id },
        data: { 
          status: "MAGIC_LINK_SENT",
          lastActivityAt: new Date()
        }
      });

      emailsSent++;
    }

    return NextResponse.json({ success: true, processed: emailsSent });
  } catch (error: any) {
    console.error("Cron Error [abandoned-leads]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
