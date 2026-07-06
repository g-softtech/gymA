import { prisma } from "@/lib/prisma";
import { MembershipStatus } from "@prisma/client";

export interface SubscriptionHealthRecord {
  id: string;
  memberId: string;
  status: MembershipStatus;
  endDate: Date;
  startDate: Date;
  plan: {
    name: string;
  };
  member: {
    user: {
      name: string | null;
      email: string | null;
    };
  };
}

const subscriptionHealthSelect = {
  id: true,
  memberId: true,
  status: true,
  endDate: true,
  startDate: true,
  plan: {
    select: { name: true },
  },
  member: {
    select: {
      user: {
        select: { name: true, email: true },
      },
    },
  },
};

export async function getSubscriptionsForHealth(tenantId: string): Promise<SubscriptionHealthRecord[]> {
  return prisma.subscription.findMany({
    where: { tenantId },
    select: subscriptionHealthSelect,
  });
}

export async function getPaginatedSubscriptions(
  tenantId: string,
  skip: number,
  take: number
): Promise<{ data: SubscriptionHealthRecord[]; total: number }> {
  const [data, total] = await Promise.all([
    prisma.subscription.findMany({
      where: { tenantId },
      skip,
      take,
      // Order by End Date asc so expiring soonest is top, then by memberId for stable deterministic ordering
      orderBy: [
        { endDate: "asc" },
        { memberId: "asc" },
      ],
      select: subscriptionHealthSelect,
    }),
    prisma.subscription.count({ where: { tenantId } }),
  ]);

  return { data, total };
}
