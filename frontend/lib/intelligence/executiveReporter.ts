import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

export interface MonthlyImpactReport {
  month: Date;
  activeTenants: number;
  totalMrrRetained: number;
  totalInterventions: number;
  successRate: number;
  activeRegistryVersion: string;
  experimentsRun: number;
  promotions: number;
}

export class ExecutiveReporter {
  
  /**
   * Generates the CEO-facing monthly intelligence impact report.
   * Separates the operational metrics (Dashboards) from the business narrative (Reports).
   */
  static async generateMonthlyImpactReport(targetDate: Date = new Date()): Promise<MonthlyImpactReport> {
    const start = startOfMonth(targetDate);
    const end = endOfMonth(targetDate);

    // 1. Identify all intelligence interventions in the month
    const actionLogs = await prisma.intelligenceActionLog.findMany({
      where: {
        executedAt: { gte: start, lte: end }
      },
      include: {
        experimentOutcomes: true
      }
    });

    const totalInterventions = actionLogs.length;
    let totalMrrRetained = 0;
    let totalSuccesses = 0;
    const uniqueTenants = new Set<string>();

    for (const rawLog of actionLogs) {
      const log = rawLog as any;
      uniqueTenants.add(log.tenantId);
      // In a real system, you might have explicit success logging outside of experiments,
      // but here we use the attached experiment outcomes for MRR attribution.
      if (log.experimentOutcomes && log.experimentOutcomes.length > 0) {
        const outcome = log.experimentOutcomes[0];
        if (outcome.success) {
          totalSuccesses++;
          totalMrrRetained += outcome.mrrImpact;
        }
      }
    }

    const successRate = totalInterventions > 0 ? (totalSuccesses / totalInterventions) : 0;

    // 2. Intelligence Governance Narrative
    const activeVersion = await prisma.intelligenceVersionRegistry.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { activatedAt: "desc" }
    });

    const experimentsRun = await prisma.intelligenceExperiment.count({
      where: {
        createdAt: { gte: start, lte: end }
      }
    });

    const promotions = await prisma.intelligencePromotionLog.count({
      where: {
        promotedAt: { gte: start, lte: end }
      }
    });

    return {
      month: start,
      activeTenants: uniqueTenants.size,
      totalMrrRetained,
      totalInterventions,
      successRate,
      activeRegistryVersion: activeVersion ? `Scoring v${activeVersion.scoringVersion} / Policy v${activeVersion.policyVersion}` : "v1.0",
      experimentsRun,
      promotions
    };
  }
}
