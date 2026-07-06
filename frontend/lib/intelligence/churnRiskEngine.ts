import { prisma } from "@/lib/prisma";
import { Clock } from "@/lib/time/Clock";
import { ActionableRecommendation, RecommendationReasonCode } from "./types";
import { ScoringEngine, ConfidenceInput } from "./scoringEngine";
import { IntelligenceSegment } from "@prisma/client";
import { DeterministicRankingPolicy } from "./explorationPolicy";

/**
 * Churn Risk Engine
 * Analyzes active subscriptions nearing expiry and cross-references them with attendance data.
 * Emits actionable recommendations for members with high churn probability.
 */
export class ChurnRiskEngine {
  private scoringEngine = new ScoringEngine();
  constructor(private readonly clock: Clock) {}

  async analyze(tenantId: string): Promise<ActionableRecommendation[]> {
    const now = this.clock.now();
    
    // Look ahead 14 days for expiries
    const riskWindowEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    // Look back 21 days for attendance check
    const attendanceWindowStart = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);

    // 1. Find ACTIVE subscriptions expiring within 14 days
    const expiringSubs = await prisma.subscription.findMany({
      where: {
        tenantId,
        status: "ACTIVE",
        endDate: {
          gt: now,
          lte: riskWindowEnd,
        },
      },
      include: {
        plan: true,
        member: true,
      }
    });

    if (expiringSubs.length === 0) {
      return [];
    }

    const memberIds = expiringSubs.map(s => s.memberId);

    // 2. Query attendance for these members in the last 21 days
    const recentAttendances = await prisma.attendance.groupBy({
      by: ['memberId'],
      where: {
        tenantId,
        memberId: { in: memberIds },
        checkInTime: { gte: attendanceWindowStart },
      },
      _count: {
        id: true,
      }
    });

    const attendanceMap = new Map<string, number>();
    for (const a of recentAttendances) {
      attendanceMap.set(a.memberId, a._count.id);
    }

    // 3. Identify High Risk (0 attendances in 21 days, expiring in 14 days)
    // Identify Medium Risk (1-2 attendances in 21 days, expiring in 14 days)
    const highRiskIds: string[] = [];
    const mediumRiskIds: string[] = [];
    let highRiskMrrAtRisk = 0;
    let mediumRiskMrrAtRisk = 0;

    for (const sub of expiringSubs) {
      const attendanceCount = attendanceMap.get(sub.memberId) || 0;
      const price = Number(sub.plan.price);

      if (attendanceCount === 0) {
        highRiskIds.push(sub.memberId);
        highRiskMrrAtRisk += price;
      } else if (attendanceCount <= 2) {
        mediumRiskIds.push(sub.memberId);
        mediumRiskMrrAtRisk += price;
      }
    }

    const recommendations: ActionableRecommendation[] = [];

    // Fetch dynamic baseline success rates and settings
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId }
    });
    const lambdaDecay = settings?.learningDecayLambda ?? 0.04;

    const discountMetric = await prisma.tenantIntelligenceMetrics.findFirst({
      where: { tenantId, metricType: "CHURN", actionType: "DISCOUNT", segmentKey: IntelligenceSegment.HIGH_RISK },
      orderBy: { windowEnd: 'desc' }
    });

    const emailMetric = await prisma.tenantIntelligenceMetrics.findFirst({
      where: { tenantId, metricType: "CHURN", actionType: "EMAIL", segmentKey: IntelligenceSegment.MEDIUM_RISK },
      orderBy: { windowEnd: 'desc' }
    });

    const getAgeInDays = (date: Date) => (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

    const discountConfidenceInput: ConfidenceInput = {
      historicalSuccessRate: discountMetric ? discountMetric.successRate : 0.1,
      historicalFailureRate: discountMetric ? (1 - discountMetric.successRate) : 0.9,
      behavioralDeviation: 1.0, // Hardcoded high risk
      ageInDays: discountMetric ? getAgeInDays(discountMetric.lastComputedAt) : 0,
      lambdaDecay,
      sampleCount: discountMetric ? discountMetric.totalSamples : 0,
      weights: { posteriorWeight: 0.5, behaviorWeight: 0.5 }
    };

    const emailConfidenceInput: ConfidenceInput = {
      historicalSuccessRate: emailMetric ? emailMetric.successRate : 0.1,
      historicalFailureRate: emailMetric ? (1 - emailMetric.successRate) : 0.9,
      behavioralDeviation: 0.6, // Hardcoded medium risk
      ageInDays: emailMetric ? getAgeInDays(emailMetric.lastComputedAt) : 0,
      lambdaDecay,
      sampleCount: emailMetric ? emailMetric.totalSamples : 0,
      weights: { posteriorWeight: 0.5, behaviorWeight: 0.5 }
    };

    const discountResult = this.scoringEngine.calculate(discountConfidenceInput);
    const emailResult = this.scoringEngine.calculate(emailConfidenceInput);

    // Emit High Risk Recommendation
    if (highRiskIds.length > 0) {
      recommendations.push({
        id: `churn_high_${tenantId}_${now.getTime()}`,
        algorithmVersion: discountResult.algorithmVersion,
        explorationVersion: 1,
        explorationPolicy: "DETERMINISTIC_RANKING",
        scoringSnapshot: {
          algorithmVersion: discountResult.algorithmVersion,
          explorationVersion: 1,
          weights: discountConfidenceInput.weights,
          confidenceInput: discountConfidenceInput
        },
        title: "High Churn Risk: Zero Attendance",
        description: `Found ${highRiskIds.length} members expiring in <14 days with zero visits in the last 3 weeks.`,
        impact: {
          mrrAtRisk: highRiskMrrAtRisk
        },
        actionType: "DISCOUNT",
        confidenceScore: discountResult.score,
        requiresApproval: true,
        actionTemplate: "win-back-20",
        executeMode: "semi-automated",
        targetMemberIds: highRiskIds,
        reasons: [
          {
            code: "NO_ENGAGEMENT",
            message: "0 attendances in the last 21 days",
            weight: 0.8,
            evidence: { attendanceCount: 0 }
          },
          {
            code: "EXPIRING_SOON",
            message: "Subscription expires in <14 days",
            weight: 0.6
          }
        ]
      });
    }

    // Emit Medium Risk Recommendation
    if (mediumRiskIds.length > 0) {
      recommendations.push({
        id: `churn_med_${tenantId}_${now.getTime()}`,
        algorithmVersion: emailResult.algorithmVersion,
        explorationVersion: 1,
        explorationPolicy: "DETERMINISTIC_RANKING",
        scoringSnapshot: {
          algorithmVersion: emailResult.algorithmVersion,
          explorationVersion: 1,
          weights: emailConfidenceInput.weights,
          confidenceInput: emailConfidenceInput
        },
        title: "Medium Churn Risk: Low Engagement",
        description: `Found ${mediumRiskIds.length} members expiring in <14 days with low recent attendance (≤ 2 visits).`,
        impact: {
          mrrAtRisk: mediumRiskMrrAtRisk
        },
        actionType: "EMAIL",
        confidenceScore: emailResult.score,
        requiresApproval: false,
        actionTemplate: "check-in-personal",
        executeMode: "automatic",
        targetMemberIds: mediumRiskIds,
        reasons: [
          {
            code: "LOW_ATTENDANCE",
            message: "< 2 attendances in the last 21 days",
            weight: 0.5,
            evidence: { expected: 6 }
          },
          {
            code: "EXPIRING_SOON",
            message: "Subscription expires in <14 days",
            weight: 0.3
          }
        ]
      });
    }

    const policy = new DeterministicRankingPolicy();
    return policy.rank([...recommendations]);
  }
}
