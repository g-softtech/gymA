import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import {
  getTenantContextFromSession,
  requireAdmin,
  noTenantContext,
} from "@/lib/tenant";

/**
 * GET /api/attendance/export
 * Exports attendance records as CSV for the authenticated admin's tenant.
 * ADMIN / SUPERADMIN only.
 *
 * Query params:
 *   from=YYYY-MM-DD  (optional)
 *   to=YYYY-MM-DD    (optional)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    const ctx = getTenantContextFromSession(session);

    const roleErr = requireAdmin(ctx);
    if (roleErr) return roleErr;
    if (!ctx?.tenantId) return noTenantContext();

    const from = req.nextUrl.searchParams.get("from");
    const to = req.nextUrl.searchParams.get("to");

    const records = await prisma.attendance.findMany({
      where: {
        tenantId: ctx.tenantId,
        ...(from || to
          ? {
              checkedInAt: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}),
              },
            }
          : {}),
      },
      include: {
        member: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { checkedInAt: "desc" },
    });

    // Build CSV
    const header = "Date,Time,Member Name,Member Email,Note";
    const rows = records.map((r) => {
      const date = new Date(r.checkedInAt);
      const dateStr = date.toLocaleDateString("en-GB"); // DD/MM/YYYY
      const timeStr = date.toLocaleTimeString("en-NG", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const name = (r.member.user.name ?? "").replace(/,/g, " ");
      const email = r.member.user.email ?? "";
      const note = (r.note ?? "").replace(/,/g, " ");
      return `${dateStr},${timeStr},${name},${email},${note}`;
    });

    const csv = [header, ...rows].join("\n");
    const filename = `attendance-export-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
