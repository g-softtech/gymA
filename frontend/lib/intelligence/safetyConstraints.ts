import { prisma } from "@/lib/prisma";
import { ActionableRecommendation } from "./types";
import { Clock } from "@/lib/time/Clock";

export class SafetyConstraints {
  constructor(private readonly clock: Clock) {}

  /**
   * Filters out recommendations that violate system safety limits.
   * Returns a sanitized array of safe intents.
   */
  async enforce(tenantId: string, recommendations: ActionableRecommendation[]): Promise<ActionableRecommendation[]> {
    if (recommendations.length === 0) return [];

    const now = this.clock.now();
    const safeRecommendations: ActionableRecommendation[] = [];

    // 1. VOLUME GUARD: Check how many campaigns executed today
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const todayCampaignCount = await prisma.intelligenceActionLog.count({
      where: {
        tenantId,
        executedAt: { gte: startOfDay },
        actionType: { in: ["DISCOUNT", "EMAIL"] } // High-volume campaign types
      }
    });

    const MAX_DAILY_CAMPAIGNS = 5;
    let availableVolume = Math.max(0, MAX_DAILY_CAMPAIGNS - todayCampaignCount);

    for (const rec of recommendations) {
      if (rec.actionType === "DISCOUNT" || rec.actionType === "EMAIL") {
        if (availableVolume <= 0) {
          console.log(`[SafetyGuard] Volume Limit reached. Dropping recommendation: ${rec.title}`);
          continue; // Drop this recommendation
        }
        availableVolume--;
      }

      // 2. TEMPORAL & IDENTITY GUARD: Filter out targets who received this action recently
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      
      const recentLogs = await prisma.intelligenceActionLog.findMany({
        where: {
          tenantId,
          targetMemberId: { in: rec.targetMemberIds },
          actionType: rec.actionType,
          executedAt: { gte: fourteenDaysAgo }
        },
        select: { targetMemberId: true }
      });

      const recentlyTargetedIds = new Set(recentLogs.map(l => l.targetMemberId));
      
      // Remove those members from the target array
      rec.targetMemberIds = rec.targetMemberIds.filter(id => !recentlyTargetedIds.has(id));

      // If no valid targets remain, drop the recommendation entirely
      if (rec.targetMemberIds.length === 0) {
        console.log(`[SafetyGuard] All targets filtered by Identity/Temporal guards. Dropping: ${rec.title}`);
        continue;
      }

      // 3. Recalculate impact based on reduced audience
      if (rec.impact.mrrAtRisk) {
        // Simple heuristic: reduce impact proportionally to remaining targets
        // Note: In a real system, you'd recalculate exact MRR by joining the remaining target IDs with their plan price.
        // For phase 6, we'll keep the intent intact but note that the audience was filtered.
      }

      safeRecommendations.push(rec);
    }

    return safeRecommendations;
  }
}
