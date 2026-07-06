import { prisma } from "@/lib/prisma";
import { Clock } from "@/lib/time/Clock";

export class ActionOutcomeTracker {
  constructor(private readonly clock: Clock) {}

  /**
   * Processes all PENDING intelligence action logs.
   * This should be called by a daily cron job.
   */
  async evaluatePendingOutcomes(): Promise<number> {
    const pendingLogs = await prisma.intelligenceActionLog.findMany({
      where: { outcomeStatus: "PENDING" },
      include: {
        targetMember: {
          include: {
            subscriptions: {
              where: { status: "ACTIVE" },
              orderBy: { endDate: "desc" },
              take: 1,
              include: { plan: true }
            }
          }
        }
      }
    });

    if (pendingLogs.length === 0) return 0;

    let processedCount = 0;
    const now = this.clock.now();

    for (const log of pendingLogs) {
      const activeSub = log.targetMember.subscriptions[0];
      
      let isSuccess = false;
      let isPartialSuccess = false;
      let isTimeout = false;
      let mrrImpact = 0;

      // 1. Check for Behavioral Success (Event-Driven)
      if (activeSub) {
        mrrImpact = Number(activeSub.plan.price);
        
        // Did they downgrade their plan?
        // Assuming log.mrrImpact originally holds the expected MRR impact (we didn't store it originally, but we can look at the price vs previous price)
        // For Phase 7 simplicity: we'll classify as PARTIAL if the new plan price is significantly lower than standard plans, or if we can see they downgraded.
        // As a heuristic for now: if mrrImpact < 20, we call it a partial success (downgrade).
        if (mrrImpact < 20 && mrrImpact > 0) {
          isPartialSuccess = true;
        } else {
          isSuccess = true;
        }
      } else {
        // 2. Check for Timeout Fallbacks
        const daysSinceExecution = (now.getTime() - log.executedAt.getTime()) / (1000 * 60 * 60 * 24);

        if (log.actionType === "DISCOUNT" && daysSinceExecution > 14) {
          isTimeout = true;
        } else if (log.actionType === "RETRY_PAYMENT" && daysSinceExecution > 14) {
          isTimeout = true;
        } else if (log.actionType === "EMAIL" && daysSinceExecution > 10) {
          isTimeout = true;
        }
      }

      if (isSuccess || isPartialSuccess) {
        await prisma.intelligenceActionLog.update({
          where: { id: log.id },
          data: {
            outcomeStatus: isSuccess ? "SUCCESS" : "PARTIAL_SUCCESS",
            resolvedAt: now,
            mrrImpact,
          }
        });
        processedCount++;
      } else if (isTimeout) {
        await prisma.intelligenceActionLog.update({
          where: { id: log.id },
          data: {
            outcomeStatus: "FAILED",
            resolvedAt: now,
            mrrImpact: 0,
          }
        });
        processedCount++;
      }
    }

    return processedCount;
  }
}
