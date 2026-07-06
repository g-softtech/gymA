import { prisma } from "@/lib/prisma";

export class GovernanceEngine {
  /**
   * Promotes an experiment variant to become the official production truth.
   * Idempotent: Prevents the same experiment from being promoted twice.
   */
  static async promoteVariantToProduction(
    experimentId: string,
    variantName: string,
    promotedBy: string,
    reason?: string
  ) {
    return await prisma.$transaction(async (tx) => {
      // 1. Check idempotency: Has this experiment already been promoted?
      const existingPromotion = await tx.intelligencePromotionLog.findFirst({
        where: { experimentId }
      });
      if (existingPromotion) {
        throw new Error(`Experiment ${experimentId} has already been promoted.`);
      }

      // 2. Fetch the currently active registry version
      const activeVersion = await tx.intelligenceVersionRegistry.findFirst({
        where: { status: "ACTIVE" },
        orderBy: { activatedAt: "desc" }
      });

      // 3. Deactivate the current version
      if (activeVersion) {
        await tx.intelligenceVersionRegistry.update({
          where: { id: activeVersion.id },
          data: {
            status: "DEPRECATED",
            deactivatedAt: new Date()
          }
        });
      }

      // 4. Create the new Active Registry kernel config
      // Bumping policyVersion as the variant likely modifies the Exploration Policy
      const newVersion = await tx.intelligenceVersionRegistry.create({
        data: {
          scoringVersion: activeVersion ? activeVersion.scoringVersion : 1,
          policyVersion: activeVersion ? activeVersion.policyVersion + 1 : 1,
          experimentId,
          promotedVariant: variantName,
          status: "ACTIVE",
          previousVersionId: activeVersion ? activeVersion.id : null,
        }
      });

      // 5. Log the promotion securely
      await tx.intelligencePromotionLog.create({
        data: {
          experimentId,
          variantName,
          promotedBy,
          reason
        }
      });

      return newVersion;
    });
  }

  /**
   * Evaluates the kill switch to determine if AI should be short-circuited.
   * Sits ABOVE the ActionExecutor to prevent AI actions from firing if disabled.
   */
  static async evaluateKillSwitch(tenantId?: string): Promise<{ active: boolean; reason?: string }> {
    // Check for global or tenant-specific kill switches that are currently active
    // For performance, this would typically use Redis or an in-memory cache,
    // but we use the DB audit trail for structural permanence.
    
    // In a real system, we'd check a fast flag. 
    // Here we query the latest safety event for the tenant or global.
    const latestEvent = await prisma.intelligenceSafetyEvent.findFirst({
      where: {
        OR: [
          { tenantId: null },
          { tenantId }
        ]
      },
      orderBy: { triggeredAt: "desc" }
    });

    if (latestEvent && latestEvent.action === "DISABLE") {
      return { active: true, reason: latestEvent.reason };
    }

    return { active: false };
  }
}
