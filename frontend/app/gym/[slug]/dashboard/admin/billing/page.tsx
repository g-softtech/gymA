import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SAAS_PLANS, getTenantLimits } from "@/lib/billing";
import SaaSCheckoutButton from "@/components/admin/SaaSCheckoutButton";
import { TenantPlan } from "@prisma/client";

export default async function BillingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getAuthSession();

  if (!session?.user) redirect(`/api/auth/signin?callbackUrl=/gym/${slug}/dashboard/admin/billing`);
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") {
    redirect(`/gym/${slug}/dashboard`);
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      saasInvoices: { orderBy: { createdAt: "desc" } },
      _count: {
        select: {
          users: { where: { role: "MEMBER" } },
        },
      },
    },
  });

  if (!tenant) return <p>Gym not found.</p>;

  const trainerCount = await prisma.user.count({
    where: { tenantId: tenant.id, role: "TRAINER" },
  });
  
  const memberCount = tenant._count.users;

  // Calculate AI usage
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  let aiUsage = 0;
  if (tenant.plan === "FREE") {
    // Free trial counts total AI requests over all time
    aiUsage = await prisma.aiLog.count({
      where: { tenantId: tenant.id },
    });
  } else {
    // Paid plans count per month
    aiUsage = await prisma.aiLog.count({
      where: {
        tenantId: tenant.id,
        createdAt: { gte: startOfMonth },
      },
    });
  }

  const limits = getTenantLimits(tenant.plan);
  
  const daysRemaining = tenant.billingEndsAt 
    ? Math.ceil((tenant.billingEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : tenant.trialEndsAt
    ? Math.ceil((tenant.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const isActive = daysRemaining >= -3; // Includes 3-day grace period
  const isGrace = daysRemaining < 0 && daysRemaining >= -3;

  const usageStats = [
    { 
      label: "Members", 
      used: memberCount, 
      limit: limits.maxMembers,
      pct: Math.min(100, (memberCount / limits.maxMembers) * 100),
      displayLimit: limits.maxMembers > 100000 ? "Unlimited" : limits.maxMembers
    },
    { 
      label: "Trainers", 
      used: trainerCount, 
      limit: limits.maxTrainers,
      pct: Math.min(100, (trainerCount / limits.maxTrainers) * 100),
      displayLimit: limits.maxTrainers > 100000 ? "Unlimited" : limits.maxTrainers
    },
    { 
      label: "AI Requests", 
      used: aiUsage, 
      limit: limits.maxAiRequests,
      pct: limits.maxAiRequests === 0 ? 100 : Math.min(100, (aiUsage / limits.maxAiRequests) * 100),
      displayLimit: limits.maxAiRequests > 100000 ? "Unlimited" : limits.maxAiRequests === 0 ? "0" : limits.maxAiRequests
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="text-gray-500 mt-1">Manage your CortexFit SaaS plan and usage limits</p>
      </div>

      {/* Status Banner */}
      <div className={`p-6 rounded-2xl border-2 flex items-center justify-between ${
        !isActive ? "bg-red-50 border-red-200" : isGrace ? "bg-yellow-50 border-yellow-200" : "bg-indigo-50 border-indigo-200"
      }`}>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide opacity-80 mb-1">Current Plan</p>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-extrabold">{limits.name}</h2>
            {!isActive ? (
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">Expired</span>
            ) : isGrace ? (
              <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold">Grace Period</span>
            ) : (
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">Active</span>
            )}
          </div>
          <p className="mt-2 text-sm font-medium opacity-90">
            {!isActive 
              ? "Your subscription has expired. Please renew to restore admin access."
              : `Renews/Expires in ${daysRemaining} days (${
                  (tenant.billingEndsAt || tenant.trialEndsAt)?.toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })
                })`
            }
          </p>
        </div>
      </div>

      {/* Usage Meters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Current Usage</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {usageStats.map((stat) => {
            const isWarning = stat.pct >= 80 && stat.pct < 100;
            const isDanger = stat.pct >= 100;
            return (
              <div key={stat.label}>
                <div className="flex justify-between items-end mb-2">
                  <p className="font-semibold text-gray-700">{stat.label}</p>
                  <p className="text-sm font-medium text-gray-500">
                    <span className={isDanger ? "text-red-600 font-bold" : isWarning ? "text-yellow-600 font-bold" : "text-gray-900"}>
                      {stat.used}
                    </span> / {stat.displayLimit}
                  </p>
                </div>
                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${isDanger ? "bg-red-500" : isWarning ? "bg-yellow-500" : "bg-indigo-500"}`}
                    style={{ width: `${stat.pct}%` }}
                  />
                </div>
                {isDanger && stat.displayLimit !== "Unlimited" && (
                  <p className="text-xs text-red-500 mt-2 font-medium">Limit reached. Upgrade required.</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Available Plans */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(["STARTER", "GROWTH", "ENTERPRISE"] as TenantPlan[]).map((planKey) => {
            const plan = SAAS_PLANS[planKey];
            const isCurrent = tenant.plan === planKey && tenant.billingEndsAt != null;
            return (
              <div key={planKey} className={`bg-white rounded-2xl border-2 p-6 flex flex-col ${isCurrent ? "border-indigo-500 ring-1 ring-indigo-500" : "border-gray-100"}`}>
                {isCurrent && <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-md self-start mb-3">Current Plan</span>}
                <h4 className="text-xl font-bold text-gray-900">{plan.name}</h4>
                <div className="flex items-baseline gap-1 mt-2 mb-4">
                  <span className="text-2xl font-extrabold text-gray-900">₦{plan.price.toLocaleString()}</span>
                  <span className="text-gray-400 text-sm">/mo</span>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex gap-2 text-sm text-gray-600">
                      <span className="text-green-500">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <SaaSCheckoutButton
                  email={session.user.email!}
                  amount={plan.price}
                  planName={planKey}
                  tenantId={tenant.id}
                  className={`w-full font-bold py-3 px-4 rounded-xl transition ${
                    isCurrent ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                >
                  {isCurrent ? "Renew Plan" : "Upgrade"}
                </SaaSCheckoutButton>
              </div>
            );
          })}
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Billing History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500 uppercase tracking-wide text-xs">
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Plan</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Reference</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tenant.saasInvoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    No payment history yet.
                  </td>
                </tr>
              ) : (
                tenant.saasInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900 font-medium">
                      {inv.createdAt.toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" })}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{SAAS_PLANS[inv.plan].name}</td>
                    <td className="px-6 py-4 text-gray-900 font-medium">₦{inv.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{inv.reference}</td>
                    <td className="px-6 py-4">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
