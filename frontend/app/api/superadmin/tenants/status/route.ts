import { NextResponse } from "next/server";
import { getTenantContextFromSession, requireSuperAdmin } from "@/lib/tenant";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { verifyWriteAccess } from "@/lib/sandbox/guard";
export async function PATCH(req: Request) {
  try {
    const session = await getAuthSession();
    if (session?.user?.tenantId) {
      await verifyWriteAccess(session.user.tenantId);
    }
    const ctx = getTenantContextFromSession(session);
    const roleErr = requireSuperAdmin(ctx);
    if (roleErr) return roleErr;

    const body = await req.json();
    const { tenantId, status } = body;

    if (!tenantId || !status) {
      return NextResponse.json({ error: "Missing tenantId or status" }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        users: {
          where: { role: "ADMIN" },
          take: 1,
        }
      }
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Update status
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { status },
    });

    // Send email notification on approval
    if (status === "APPROVED" && tenant.status !== "APPROVED") {
      const ownerEmail = tenant.users[0]?.email;
      if (ownerEmail) {
        // Dispatch email notification
        if (process.env.RESEND_API_KEY) {
          try {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                from: "CortexFit <info@thecortexsystems.com>",
                to: ownerEmail,
                subject: "Your Smart Gym Dashboard is Ready! 🎉",
                html: `
                  <div style="font-family: sans-serif; padding: 20px;">
                    <h2>Welcome to Cortex Systems!</h2>
                    <p>Your gym application for <strong>${tenant.name}</strong> has been approved by our team.</p>
                    <p>Your platform dashboard is now unlocked and ready for configuration.</p>
                    <p><a href="${process.env.NEXTAUTH_URL}/gym/${tenant.slug}/dashboard/admin" style="display:inline-block; padding: 10px 20px; background-color: #6366F1; color: white; text-decoration: none; border-radius: 6px;">Go to Dashboard</a></p>
                  </div>
                `
              })
            });
            console.log(`[Superadmin] Approval email sent to ${ownerEmail}`);
          } catch (e) {
            console.error("[Superadmin] Failed to send approval email via Resend:", e);
          }
        } else {
          console.log(`[Superadmin] Dummy Log: Approval email would be sent to ${ownerEmail} (RESEND_API_KEY not configured)`);
        }
      }
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("[PATCH /api/superadmin/tenants/status]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
