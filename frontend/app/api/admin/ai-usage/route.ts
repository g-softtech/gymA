import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import {
  getTenantContextFromSession,
  requireAdmin,
  noTenantContext,
} from "@/lib/tenant";

/**
 * GET /api/admin/ai-usage
 *
 * Returns AI usage statistics for the authenticated admin's tenant.
 * Shows: total calls per feature, daily breakdown, top users.
 *
 * Query params:
 *   - days?: number  (default: 30) — lookback window
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    const ctx = getTenantContextFromSession(session);

    const roleErr = requireAdmin(ctx);
    if (roleErr) return roleErr;
    if (!ctx?.tenantId) return noTenantContext();

    const daysParam = req.nextUrl.searchParams.get("days");
    const days = Math.min(Math.max(parseInt(daysParam ?? "30", 10), 1), 90);
    const since = new Date();
    since.setDate(since.getDate() - days);

    // ── Total calls per feature ────────────────────────────────────────────────
    const byFeature = await prisma.aiLog.groupBy({
      by: ["feature"],
      where: { tenantId: ctx.tenantId, createdAt: { gte: since } },
      _count: { id: true },
      _sum: { inputTokens: true, outputTokens: true },
    });

    // ── Total calls per day (for sparkline charts) ─────────────────────────────
    const allLogs = await prisma.aiLog.findMany({
      where: { tenantId: ctx.tenantId, createdAt: { gte: since } },
      select: { createdAt: true, feature: true, success: true },
      orderBy: { createdAt: "asc" },
    });

    // Group by date string (YYYY-MM-DD)
    const dailyMap: Record<string, number> = {};
    for (const log of allLogs) {
      const day = log.createdAt.toISOString().slice(0, 10);
      dailyMap[day] = (dailyMap[day] ?? 0) + 1;
    }
    const dailyBreakdown = Object.entries(dailyMap).map(([date, count]) => ({
      date,
      count,
    }));

    // ── Top users by AI call count ─────────────────────────────────────────────
    const byUser = await prisma.aiLog.groupBy({
      by: ["userId"],
      where: { tenantId: ctx.tenantId, createdAt: { gte: since } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });

    // Resolve user names
    const userIds = byUser.map((u) => u.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

    const topUsers = byUser.map((u) => ({
      userId: u.userId,
      name: userMap[u.userId]?.name ?? "Unknown",
      email: userMap[u.userId]?.email ?? "",
      callCount: u._count.id,
    }));

    // ── Summary ────────────────────────────────────────────────────────────────
    const totalCalls = byFeature.reduce((sum, f) => sum + f._count.id, 0);
    const totalInputTokens = byFeature.reduce(
      (sum, f) => sum + (f._sum.inputTokens ?? 0),
      0
    );
    const totalOutputTokens = byFeature.reduce(
      (sum, f) => sum + (f._sum.outputTokens ?? 0),
      0
    );

    return NextResponse.json({
      period: { days, since: since.toISOString() },
      summary: {
        totalCalls,
        totalInputTokens,
        totalOutputTokens,
        estimatedCost: +(
          // Gemini 2.0 Flash pricing: ~$0.075/M input tokens + $0.30/M output tokens
          (totalInputTokens / 1_000_000) * 0.075 +
          (totalOutputTokens / 1_000_000) * 0.30
        ).toFixed(4),
      },
      byFeature: byFeature.map((f) => ({
        feature: f.feature,
        callCount: f._count.id,
        inputTokens: f._sum.inputTokens ?? 0,
        outputTokens: f._sum.outputTokens ?? 0,
      })),
      dailyBreakdown,
      topUsers,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
