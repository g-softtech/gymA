import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OperationsMetrics } from "@/lib/intelligence/types";
import { getAuthSession } from "@/lib/auth";

export async function GET() {
  const session = await getAuthSession();
  if (session?.user?.role !== "SUPERADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Get the most recent rollup per tenant
  const latestRollups = await prisma.intelligenceOpsMetrics.groupBy({
    by: ['tenantId'],
    _max: {
      timestamp: true,
      lastRollup: true,
    }
  });

  const latestTimestamps = latestRollups.map(r => r._max.timestamp).filter(Boolean) as Date[];

  const metrics = await prisma.intelligenceOpsMetrics.aggregate({
    where: {
      timestamp: {
        in: latestTimestamps
      }
    },
    _sum: {
      failedExecutionCount: true,
    },
    _avg: {
      averageExecutionTime: true,
      averageEvaluationDelay: true,
    }
  });

  // Calculate health
  const maxRollup = latestRollups.reduce((max, current) => {
    if (!current._max.lastRollup) return max;
    if (!max) return current._max.lastRollup;
    return current._max.lastRollup.getTime() > max.getTime() ? current._max.lastRollup : max;
  }, null as Date | null);

  let rollupHealth: OperationsMetrics["rollupHealth"] = "broken";
  if (maxRollup) {
    const ageHours = (Date.now() - maxRollup.getTime()) / (1000 * 60 * 60);
    if (ageHours < 6) rollupHealth = "healthy";
    else if (ageHours <= 24) rollupHealth = "warning";
    else if (ageHours <= 72) rollupHealth = "stale";
  }

  const failedCount = metrics._sum.failedExecutionCount || 0;
  let queueHealth: OperationsMetrics["queueHealth"] = "healthy";
  if (failedCount > 50) queueHealth = "failing";
  else if (failedCount > 10) queueHealth = "degraded";

  const data: OperationsMetrics = {
    lastRollup: maxRollup,
    rollupHealth,
    averageExecutionTime: metrics._avg.averageExecutionTime || 0,
    averageEvaluationDelay: metrics._avg.averageEvaluationDelay || 0,
    failedCount,
    queueHealth,
  };

  return NextResponse.json(data);
}
