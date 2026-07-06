import { prisma } from "@/lib/prisma";
import MemberBillingDashboard from "./MemberBillingDashboard";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Member Billing Dashboard | Admin",
};

export default async function MemberBillingPage({ params }: { params: { slug: string } }) {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: params.slug },
    select: { id: true }
  });

  if (!tenant) return notFound();

  // Fetch all subscriptions for this tenant
  const subscriptions = await prisma.subscription.findMany({
    where: { tenantId: tenant.id },
    include: {
      plan: true,
      member: {
        include: {
          user: true
        }
      }
    },
    orderBy: {
      endDate: "asc"
    }
  });

  const now = new Date();
  
  // Calculate Stats
  let active = 0;
  let trialing = 0;
  let pastDue = 0;
  let suspended = 0;
  let expired = 0;

  let expiring24h = 0;
  let expiring3d = 0;
  let expiring7d = 0;

  const msInDay = 1000 * 60 * 60 * 24;

  const tableData = subscriptions.map(sub => {
    const status = sub.status;
    
    if (status === "ACTIVE") active++;
    else if (status === "PENDING_PAYMENT") pastDue++;
    else if (status === "CANCELLED" || status === "SUSPENDED" || status === "REPLACED") suspended++;
    else if (status === "EXPIRED") expired++;

    // Calculate expiries for ACTIVE subs
    if (status === "ACTIVE" && sub.endDate) {
      const daysUntilExpiry = (sub.endDate.getTime() - now.getTime()) / msInDay;
      if (daysUntilExpiry > 0) {
        if (daysUntilExpiry <= 1) expiring24h++;
        if (daysUntilExpiry <= 3) expiring3d++;
        if (daysUntilExpiry <= 7) expiring7d++;
      } else {
        // Technically expired if endDate is past, but status might not be updated yet
        expired++;
        active--; // Correct the optimistic active count
      }
    }

    return {
      id: sub.id,
      memberId: sub.memberId,
      memberName: sub.member.user.name || "Unknown",
      memberEmail: sub.member.user.email || "",
      planName: sub.plan.name,
      status: sub.status,
      endDate: sub.endDate?.toISOString() || null,
      trialEndDate: null,
    };
  });

  const totalSubs = subscriptions.length;
  const churnRate = totalSubs > 0 ? Math.round(((expired + suspended) / totalSubs) * 100) : 0;

  const stats = {
    active,
    trialing,
    pastDue,
    suspended,
    expired,
    expiring24h,
    expiring3d,
    expiring7d,
    churnRate
  };

  return <MemberBillingDashboard stats={stats} subscriptions={tableData} />;
}
