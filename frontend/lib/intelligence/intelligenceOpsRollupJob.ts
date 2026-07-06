import { prisma } from "@/lib/prisma";
import { Clock } from "@/lib/time/Clock";
import { systemClock } from "@/lib/time/SystemClock";
import { ExplorationPolicyType } from "@prisma/client";

/**
 * Aggregates operational and performance metrics for the intelligence pipeline.
 * Computes the IntelligenceOpsMetrics table per tenant, algorithm, and policy.
 */
export class IntelligenceOpsRollupJob {
  constructor(private readonly clock: Clock = systemClock) {}

  async runAll(): Promise<{ success: boolean; processedTenants: number }> {
    const jobLog = await prisma.intelligenceRollupJobLog.create({
      data: { status: "STARTED" }
    });

    let processedTenants = 0;
    try {
      const tenants = await prisma.tenant.findMany({
        select: { id: true }
      });

      for (const tenant of tenants) {
        await this.runForTenant(tenant.id);
        processedTenants++;
      }

      await prisma.intelligenceRollupJobLog.update({
        where: { id: jobLog.id },
        data: {
          status: "SUCCESS",
          finishedAt: new Date(),
          recordsProcessed: processedTenants
        }
      });

      return { success: true, processedTenants };
    } catch (error) {
      await prisma.intelligenceRollupJobLog.update({
        where: { id: jobLog.id },
        data: {
          status: "FAILED",
          finishedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : "Unknown error",
          recordsProcessed: processedTenants
        }
      });
      return { success: false, processedTenants };
    }
  }

  async runForTenant(tenantId: string): Promise<void> {
    const startTime = this.clock.now().getTime();
    
    // Group logs by algorithmVersion and explorationPolicy
    const logs = await prisma.intelligenceActionLog.findMany({
      where: { tenantId }
    });

    if (logs.length === 0) return;

    type GroupKey = `${number}_${ExplorationPolicyType}`;
    const groupedLogs = new Map<GroupKey, typeof logs>();

    for (const log of logs) {
      const key: GroupKey = `${log.algorithmVersion}_${log.explorationPolicy}`;
      if (!groupedLogs.has(key)) groupedLogs.set(key, []);
      groupedLogs.get(key)!.push(log);
    }

    for (const [key, group] of groupedLogs.entries()) {
      const [algoStr, policy] = key.split("_") as [string, ExplorationPolicyType];
      const algorithmVersion = parseInt(algoStr, 10);
      const explorationVersion = group[0].explorationVersion;

      let generatedCount = 0;
      let approvedCount = 0;
      let executedCount = 0;
      let successfulCount = 0;
      let partialSuccessCount = 0;
      let failureCount = 0;
      let ignoredCount = 0;
      let failedExecutionCount = 0;
      let retainedMRR = 0;
      
      let sumConfidence = 0;
      let sumExecutionDelay = 0;
      let sumEvaluationDelay = 0;
      
      let executedWithDelay = 0;
      let evaluatedWithDelay = 0;
      
      let lastRecommendation: Date | null = null;

      for (const log of group) {
        generatedCount++;
        sumConfidence += log.confidenceScore;
        
        // Track the most recent recommendation
        if (!lastRecommendation || log.executedAt > lastRecommendation) {
          lastRecommendation = log.executedAt;
        }

        // Implicitly approved if executed in current design
        if (log.executionStatus === "EXECUTED") {
          approvedCount++;
          executedCount++;
          
          // Simulated Execution Delay (ActionExecutor runs synchronously currently, so 0-100ms)
          // Realistically, generated vs executed time would be tracked. We'll use 50ms as a placeholder.
          sumExecutionDelay += 50; 
          executedWithDelay++;
        } else if (log.executionStatus === "FAILED") {
          failedExecutionCount++;
        }

        if (log.outcomeStatus === "SUCCESS") {
          successfulCount++;
          retainedMRR += log.mrrImpact ? Number(log.mrrImpact) : 0;
        } else if (log.outcomeStatus === "PARTIAL_SUCCESS") {
          partialSuccessCount++;
          retainedMRR += log.mrrImpact ? Number(log.mrrImpact) : 0;
        } else if (log.outcomeStatus === "FAILED") {
          failureCount++;
        } else if (log.outcomeStatus === "IGNORED") {
          ignoredCount++;
        }

        if (log.resolvedAt) {
          const delay = log.resolvedAt.getTime() - log.executedAt.getTime();
          sumEvaluationDelay += delay;
          evaluatedWithDelay++;
        }
      }

      const averageConfidence = generatedCount > 0 ? sumConfidence / generatedCount : 0;
      const averageExecutionTime = executedWithDelay > 0 ? sumExecutionDelay / executedWithDelay : 0;
      const averageEvaluationDelay = evaluatedWithDelay > 0 ? sumEvaluationDelay / evaluatedWithDelay : 0;

      const durationMs = this.clock.now().getTime() - startTime;
      
      const rollupVersion = 1;
      const timestampBucket = new Date().toISOString().split('T')[0];
      const rollupKey = `${tenantId}_${timestampBucket}_v${rollupVersion}_${key}`;

      await prisma.intelligenceOpsMetrics.upsert({
        where: { rollupKey },
        update: {
          generatedCount,
          approvedCount,
          executedCount,
          successfulCount,
          partialSuccessCount,
          failureCount,
          ignoredCount,
          failedExecutionCount,
          retainedMRR,
          averageConfidence,
          averageExecutionTime,
          averageEvaluationDelay,
          lastRollup: this.clock.now(),
          rollupDurationMs: durationMs,
          lastRecommendation,
        },
        create: {
          tenantId,
          generatedCount,
          approvedCount,
          executedCount,
          successfulCount,
          partialSuccessCount,
          failureCount,
          ignoredCount,
          failedExecutionCount,
          retainedMRR,
          averageConfidence,
          averageExecutionTime,
          averageEvaluationDelay,
          lastRollup: this.clock.now(),
          rollupVersion,
          rollupDurationMs: durationMs,
          rollupKey,
          lastRecommendation,
          algorithmVersion,
          explorationVersion,
          explorationPolicy: policy,
        }
      });
    }
  }
}
