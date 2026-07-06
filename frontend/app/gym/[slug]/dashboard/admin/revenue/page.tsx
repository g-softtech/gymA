import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import MemberBillingClient from "./MemberBillingClient";

export const metadata = {
  title: "Member Billing | Admin",
};

export default async function RevenuePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getAuthSession();

  if (!session?.user) return null;
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") {
    return <p className="p-6 text-red-600">Access Denied.</p>;
  }

  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) return <p>Gym not found.</p>;

  // Use a single query to grab all subscriptions and related member/plan info
  const subscriptions = await prisma.subscription.findMany({
    where: { tenantId: tenant.id },
    include: { 
      plan: true,
      member: {
        include: {
          user: { select: { name: true, email: true, image: true } }
        }
      }
    },
    orderBy: { endDate: "asc" },
  });

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const in1Day = new Date(now);
  in1Day.setDate(now.getDate() + 1);

  const in3Days = new Date(now);
  in3Days.setDate(now.getDate() + 3);

  const in7Days = new Date(now);
  in7Days.setDate(now.getDate() + 7);

  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Aggregations
  let activeMembers = 0;
  let trialMembers = 0;
  let pendingPayment = 0;
  let suspended = 0;
  let cancelled = 0;
  let expired = 0;

  let expiresToday = 0;
  let expiresIn3Days = 0;
  let expiresIn7Days = 0;
  let autoRenewTomorrow = 0;

  let mrr = 0;
  let expectedRenewalRevenue = 0;
  let outstandingBalance = 0;

  // We map Prisma data to the props expected by the Client component
  const subsData = subscriptions.map(s => {
    const price = Number(s.plan.price) || 0;

    // Status counts
    if (s.status === "ACTIVE") {
      activeMembers++;
      mrr += price;
    } else if (s.status === "PENDING_PAYMENT") {
      pendingPayment++;
      outstandingBalance += price;
    } else if (s.status === "SUSPENDED") suspended++;
    else if (s.status === "CANCELLED") cancelled++;
    else if (s.status === "EXPIRED") expired++;

    // Renewal window counts (only for active/pending)
    if (s.status === "ACTIVE" || s.status === "PENDING_PAYMENT") {
      const end = new Date(s.endDate);
      end.setHours(0, 0, 0, 0);

      if (end.getTime() === now.getTime()) {
        expiresToday++;
        autoRenewTomorrow++;
      } else if (end > now && end <= in3Days) {
        expiresIn3Days++;
      } else if (end > in3Days && end <= in7Days) {
        expiresIn7Days++;
      }

      // Expected this month
      if (end >= now && end <= endOfMonth) {
        expectedRenewalRevenue += price;
      }
    }

    return {
      id: s.id,
      memberName: s.member.user?.name || "Unknown Member",
      memberEmail: s.member.user?.email || "",
      memberAvatar: s.member.user?.image,
      planName: s.plan.name,
      status: s.status as any,
      price: price,
      startDate: s.startDate.toISOString(),
      endDate: s.endDate.toISOString(),
      outstandingBalance: s.status === "PENDING_PAYMENT" ? price : 0,
      lastPaymentDate: s.startDate.toISOString(), // Approximated for V1 read-only
    };
  });

  // Calculate collected this month based on MRR/Transactions (approximated for V1 using startDate)
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const collectedThisMonth = subscriptions
    .filter(s => s.status === "ACTIVE" && new Date(s.startDate) >= currentMonthStart)
    .reduce((sum, s) => sum + Number(s.plan.price), 0);

  // Generate actionable alerts
  const alerts: { type: "warning" | "error" | "success" | "info"; message: string }[] = [];
  
  if (expiresToday > 0) alerts.push({ type: "warning", message: `${expiresToday} memberships expire today` });
  if (pendingPayment > 0) alerts.push({ type: "error", message: `${pendingPayment} members have pending payments` });
  if (suspended > 0) alerts.push({ type: "error", message: `${suspended} members are currently suspended` });
  if (collectedThisMonth > 0) alerts.push({ type: "success", message: `₦${collectedThisMonth.toLocaleString()} collected this month` });

  const metrics = {
    activeMembers,
    trialMembers,
    pendingPayment,
    suspended,
    cancelled,
    expired,
    expiresToday,
    expiresIn3Days,
    expiresIn7Days,
    autoRenewTomorrow,
    mrr,
    expectedRenewalRevenue,
    collectedThisMonth,
    outstandingBalance,
    alerts,
  };

  return <MemberBillingClient metrics={metrics} subscriptions={subsData} />;
}