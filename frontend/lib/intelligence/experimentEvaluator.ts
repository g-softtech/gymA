import { prisma } from "@/lib/prisma";
import { ExperimentVariant } from "@prisma/client";
import { addDays } from "date-fns";

export interface VariantMetrics {
  variant: ExperimentVariant;
  traffic: number;
  successes: number;
  conversionRate: number;
  mrrImpact: number;
}

export interface ExperimentEvaluationResult {
  experimentId: string;
  startWindow: Date;
  endWindow: Date;
  controlMetrics: VariantMetrics;
  variantMetrics: VariantMetrics[];
  globalUplift: number; // vs control
  globalSignificance: number; // mock statistical significance for now
}

export class ExperimentEvaluator {
  /**
   * Evaluates outcomes for an experiment over a specific time window.
   */
  static async evaluateWindow(
    experimentId: string,
    startWindow: Date,
    endWindow: Date
  ): Promise<ExperimentEvaluationResult | null> {
    
    // Fetch all outcomes in the window for this experiment
    const outcomes = await prisma.experimentOutcome.findMany({
      where: {
        experimentId,
        evaluationWindowStart: { gte: startWindow },
        evaluationWindowEnd: { lte: endWindow }
      }
    });

    if (outcomes.length === 0) return null;

    // Group by variant
    const grouped = new Map<ExperimentVariant, VariantMetrics>();

    for (const outcome of outcomes) {
      if (!grouped.has(outcome.variant)) {
        grouped.set(outcome.variant, {
          variant: outcome.variant,
          traffic: 0,
          successes: 0,
          conversionRate: 0,
          mrrImpact: 0,
        });
      }
      
      const metrics = grouped.get(outcome.variant)!;
      metrics.traffic += 1;
      if (outcome.success) {
        metrics.successes += 1;
      }
      metrics.mrrImpact += outcome.mrrImpact;
    }

    // Compute conversion rates
    for (const metrics of grouped.values()) {
      metrics.conversionRate = metrics.traffic > 0 ? (metrics.successes / metrics.traffic) : 0;
    }

    const controlMetrics = grouped.get(ExperimentVariant.CONTROL) || {
      variant: ExperimentVariant.CONTROL,
      traffic: 0, successes: 0, conversionRate: 0, mrrImpact: 0
    };

    const variantMetrics: VariantMetrics[] = [];
    let bestVariantUplift = 0;

    for (const [variant, metrics] of grouped.entries()) {
      if (variant !== ExperimentVariant.CONTROL) {
        variantMetrics.push(metrics);
        
        // Calculate basic uplift
        if (controlMetrics.conversionRate > 0) {
          const uplift = ((metrics.conversionRate - controlMetrics.conversionRate) / controlMetrics.conversionRate) * 100;
          if (uplift > bestVariantUplift) {
            bestVariantUplift = uplift;
          }
        }
      }
    }

    return {
      experimentId,
      startWindow,
      endWindow,
      controlMetrics,
      variantMetrics,
      globalUplift: bestVariantUplift,
      globalSignificance: 0.95, // Mock value, in real app compute p-value or Bayesian posterior
    };
  }

  /**
   * Snapshots the evaluation into the database to lock in historical truth.
   */
  static async createSnapshot(
    evaluation: ExperimentEvaluationResult
  ) {
    return prisma.experimentSnapshot.create({
      data: {
        experimentId: evaluation.experimentId,
        startWindow: evaluation.startWindow,
        endWindow: evaluation.endWindow,
        controlMetrics: evaluation.controlMetrics as any,
        variantMetrics: evaluation.variantMetrics as any,
        uplift: evaluation.globalUplift,
        significance: evaluation.globalSignificance,
      }
    });
  }
}
