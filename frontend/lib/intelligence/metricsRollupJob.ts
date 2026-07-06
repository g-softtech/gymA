import { prisma } from "@/lib/prisma";
import { IntelligenceSegment } from "@prisma/client";

export class MetricsRollupJob {
  /**
   * Computes analytics from IntelligenceActionLog and updates TenantIntelligenceMetrics.
   * This computes the last 30 days as a bounded window.
   */
  async run() {
    console.log("[MetricsRollupJob] Starting rollup...");
    
    const now = new Date();
    const windowStart = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const windowEnd = now;

    // Fetch logs within the 30-day window
    const logs = await prisma.intelligenceActionLog.groupBy({
      by: ["tenantId", "actionType", "outcomeStatus"],
      where: {
        executedAt: {
          gte: windowStart,
          lte: windowEnd
        }
      },
      _count: {
        _all: true
      }
    });

    // We assume "CHURN" metricType for these basic action logs right now
    // In the future, actionType/recommendation traces would tell us the exact metricType
    const metricType = "CHURN";
    const segmentKey = IntelligenceSegment.ALL;

    const metricsMap = new Map<string, any>();

    for (const log of logs) {
      const key = `${log.tenantId}_${log.actionType}`;
      if (!metricsMap.has(key)) {
        metricsMap.set(key, {
          tenantId: log.tenantId,
          actionType: log.actionType,
          SUCCESS: 0,
          PARTIAL_SUCCESS: 0,
          FAILED: 0,
          total: 0
        });
      }
      
      const entry = metricsMap.get(key);
      if (log.outcomeStatus === "SUCCESS") entry.SUCCESS += log._count._all;
      if (log.outcomeStatus === "PARTIAL_SUCCESS") entry.PARTIAL_SUCCESS += log._count._all;
      if (log.outcomeStatus === "FAILED" || log.outcomeStatus === "EXPIRED") entry.FAILED += log._count._all;
      
      if (log.outcomeStatus !== "PENDING") {
        entry.total += log._count._all;
      }
    }

    let updatedCount = 0;

    for (const [, metric] of metricsMap) {
      if (metric.total === 0) continue;

      const successRate = metric.SUCCESS / metric.total;
      const partialSuccessRate = metric.PARTIAL_SUCCESS / metric.total;
      const failureRate = metric.FAILED / metric.total;

      await prisma.tenantIntelligenceMetrics.upsert({
        where: {
          tenantId_metricType_actionType_segmentKey_windowStart_windowEnd: {
            tenantId: metric.tenantId,
            metricType,
            actionType: metric.actionType,
            segmentKey,
            windowStart,
            windowEnd
          }
        },
        update: {
          successRate,
          partialSuccessRate,
          failureRate,
          totalSamples: metric.total,
          lastComputedAt: now
        },
        create: {
          tenantId: metric.tenantId,
          metricType,
          actionType: metric.actionType,
          segmentKey,
          windowStart,
          windowEnd,
          successRate,
          partialSuccessRate,
          failureRate,
          totalSamples: metric.total
        }
      });

      updatedCount++;
    }

    console.log(`[MetricsRollupJob] Finished. Updated metrics for ${updatedCount} tenant-action pairs in the last 30 days.`);
    return updatedCount;
  }
}

