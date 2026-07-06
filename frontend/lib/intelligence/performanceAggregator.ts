import { prisma } from "@/lib/prisma";
import { IntelligenceSegment } from "@prisma/client";

export type ActionEffectiveness = {
  successRate: number; // 0.0 to 1.0
  totalResolved: number;
  successfulCount: number;
  totalMrrSaved: number;
};

export class PerformanceAggregator {
  constructor(private tenantId: string) {}

  /**
   * Retrieves the raw aggregated metrics for this tenant.
   * Note: In Phase 7.1, we rely heavily on ScoringEngine, 
   * but this exposes the metrics if needed for other readers.
   */
  async getMetrics() {
    return prisma.tenantIntelligenceMetrics.findFirst({
      where: {
        tenantId: this.tenantId,
        segmentKey: IntelligenceSegment.ALL
      },
      orderBy: {
        windowEnd: 'desc'
      }
    });
  }

  /**
   * Computes the historical effectiveness of a specific action type.
   * This now reads from the cached O(1) projection table.
   */
  async getActionEffectiveness(tenantId: string, actionType: string): Promise<ActionEffectiveness> {
    const metric = await prisma.tenantIntelligenceMetrics.findFirst({
      where: {
          tenantId,
          actionType,
          segmentKey: IntelligenceSegment.ALL
      },
      orderBy: {
        windowEnd: 'desc'
      }
    });

    if (!metric || metric.totalSamples === 0) {
      // Fallback baseline for new tenants or unused actions
      return {
        successRate: 0.10, // Base 10% assumption for unknown actions
        totalResolved: 0,
        successfulCount: 0,
        totalMrrSaved: 0,
      };
    }

    return {
      successRate: metric.successRate,
      totalResolved: metric.totalSamples,
      successfulCount: Math.round(metric.totalSamples * metric.successRate),
      totalMrrSaved: 0, // MRR saved calculation is moved to a different aggregation later, keeping interface stable
    };
  }
}
