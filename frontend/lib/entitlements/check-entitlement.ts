import { prisma } from "@/lib/prisma";
import { EntitlementKey, EntitlementKeys } from "./registry";
import { EntitlementsSchema } from "./schema";

export interface EntitlementResult {
  allowed: boolean;
  limit?: number;
  usage?: number;
  reason?: string;
}

export async function checkEntitlement(memberId: string, feature: EntitlementKey): Promise<EntitlementResult> {
  // 1. Fetch user's active subscription
  const member = await prisma.memberProfile.findUnique({
    where: { userId: memberId },
    include: {
      subscriptions: {
        where: { status: "ACTIVE" },
        include: { plan: true },
        take: 1,
      },
    },
  });

  if (!member) {
    return { allowed: false, reason: "Member profile not found." };
  }

  const activeSub = member.subscriptions[0];
  if (!activeSub) {
    return { allowed: false, reason: "No active subscription found. Please purchase a membership plan." };
  }

  // 2. Parse Entitlements from JSON safely
  let rawEntitlements = {};
  if (activeSub.plan.entitlements && typeof activeSub.plan.entitlements === "object") {
    rawEntitlements = activeSub.plan.entitlements;
  }
  const entitlements = EntitlementsSchema.parse(rawEntitlements);

  // 3. Evaluate the requested feature
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  switch (feature) {
    case EntitlementKeys.MAX_CLASSES_PER_MONTH: {
      const limit = entitlements[EntitlementKeys.MAX_CLASSES_PER_MONTH];
      if (limit === -1) return { allowed: true, limit };

      const usage = await prisma.booking.count({
        where: {
          memberId: member.id,
          classSessionId: { not: null },
          status: { not: "CANCELLED" },
          date: { gte: startOfMonth },
        },
      });

      if (usage >= limit) {
        return { allowed: false, limit, usage, reason: `You have reached your monthly class limit (${limit}).` };
      }
      return { allowed: true, limit, usage };
    }

    case EntitlementKeys.MAX_TRAINER_SESSIONS: {
      const limit = entitlements[EntitlementKeys.MAX_TRAINER_SESSIONS];
      if (limit === -1) return { allowed: true, limit };

      const usage = await prisma.booking.count({
        where: {
          memberId: member.id,
          trainerId: { not: null },
          status: { not: "CANCELLED" },
          date: { gte: startOfMonth },
        },
      });

      if (usage >= limit) {
        return { allowed: false, limit, usage, reason: `You have reached your monthly trainer session limit (${limit}).` };
      }
      return { allowed: true, limit, usage };
    }

    case EntitlementKeys.AI_ACCESS: {
      const allowed = entitlements[EntitlementKeys.AI_ACCESS];
      return { allowed, reason: allowed ? undefined : "AI Coach access is not included in your current plan." };
    }

    case EntitlementKeys.MAX_AI_REQUESTS: {
      if (!entitlements[EntitlementKeys.AI_ACCESS]) {
        return { allowed: false, reason: "AI Coach access is not included in your plan." };
      }
      const limit = entitlements[EntitlementKeys.MAX_AI_REQUESTS];
      if (limit === -1) return { allowed: true, limit };

      const usage = await prisma.aiLog.count({
        where: {
          userId: memberId,
          createdAt: { gte: startOfMonth },
        },
      });

      if (usage >= limit) {
        return { allowed: false, limit, usage, reason: `You have reached your monthly AI request limit (${limit}).` };
      }
      return { allowed: true, limit, usage };
    }

    case EntitlementKeys.PRIORITY_BOOKING: {
      const allowed = entitlements[EntitlementKeys.PRIORITY_BOOKING];
      return { allowed, reason: allowed ? undefined : "Priority booking is not included in your plan." };
    }

    case EntitlementKeys.SAUNA_ACCESS: {
      const allowed = entitlements[EntitlementKeys.SAUNA_ACCESS];
      return { allowed, reason: allowed ? undefined : "Sauna access is not included in your plan." };
    }

    default:
      return { allowed: false, reason: "Unknown entitlement requested." };
  }
}
