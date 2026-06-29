
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import RevenueCharts from "@/components/admin/RevenueCharts";

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
  if (!tenant) return null;
  if (!tenant) return <p>Gym not found.</p>;

  const subscriptions = await prisma.subscription.findMany({
    where: { plan: { tenantId: tenant.id } },
    include: { plan: true },
    orderBy: { startDate: "asc" },
  });

  // Total revenue
  const totalRevenue = subscriptions.reduce((sum, s) => sum + Number(s.plan.price), 0);
  const activeRevenue = subscriptions
    .filter((s) => s.status === "ACTIVE")
    .reduce((sum, s) => sum + Number(s.plan.price), 0);

  // Revenue by plan
  const byPlan: Record<string, { name: string; count: number; revenue: number }> = {};
  subscriptions.forEach((s) => {
    if (!byPlan[s.planId]) {
      byPlan[s.planId] = { name: s.plan.name, count: 0, revenue: 0 };
    }
    byPlan[s.planId].count += 1;
    byPlan[s.planId].revenue += Number(s.plan.price);
  });

  // Monthly revenue for chart (last 6 months)
  const monthly: Record<string, number> = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString("en-NG", { month: "short", year: "numeric" });
    monthly[key] = 0;
  }
  subscriptions.forEach((s) => {
    const d = new Date(s.startDate);
    const key = d.toLocaleString("en-NG", { month: "short", year: "numeric" });
    if (key in monthly) monthly[key] += Number(s.plan.price);
  });

  const monthlyData = Object.entries(monthly).map(([month, revenue]) => ({
    month,
    revenue,
  }));

  const planData = Object.values(byPlan);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Revenue & Analytics</h1>
        <p className="text-muted-foreground mt-1">Financial overview for {tenant.name}</p>
      </div>

      {/* Summary cards: Horizontal scroll on mobile, grid on tablet+ */}
      <div className="flex overflow-x-auto pb-2 md:pb-0 md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 snap-x">
        {[
          { label: "Total Revenue", value: `₦${totalRevenue.toLocaleString()}`, icon: "💰", color: "bg-success/10 text-success" },
          { label: "Active Revenue", value: `₦${activeRevenue.toLocaleString()}`, icon: "✅", color: "bg-primary/10 text-primary" },
          { label: "Total Subscriptions", value: subscriptions.length, icon: "📋", color: "bg-warning/10 text-warning" },
          { label: "Active Plans", value: Object.keys(byPlan).length, icon: "📦", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
        ].map((s) => (
          <div key={s.label} className={`min-w-[200px] md:min-w-0 flex-shrink-0 snap-start rounded-xl p-5 ${s.color}`}>
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-sm font-medium mt-1 opacity-80">{s.label}</div>
          </div>
        ))}
      </div>

      <RevenueCharts monthlyData={monthlyData} planData={planData} />

      {/* All subscriptions table */}
      <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">All Transactions</h2>
        </div>
        
        {/* Mobile View: Cards */}
        <div className="md:hidden divide-y divide-border">
          {subscriptions.length === 0 ? (
            <p className="p-6 text-center text-muted-foreground">No transactions yet.</p>
          ) : (
            subscriptions.slice().reverse().map((s) => (
              <div key={s.id} className="p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-foreground">{s.plan.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(s.startDate).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-foreground">₦{Number(s.plan.price).toLocaleString()}</div>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      s.status === "ACTIVE" ? "bg-success/10 text-success" :
                      s.status === "CANCELLED" ? "bg-destructive/10 text-destructive" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {s.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Tablet/Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted text-left text-muted-foreground text-xs uppercase tracking-wide border-b border-border">
                <th className="px-6 py-3 font-medium">Plan</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Expires</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">No transactions yet.</td>
                </tr>
              ) : (
                subscriptions.slice().reverse().map((s) => (
                  <tr key={s.id} className="hover:bg-muted">
                    <td className="px-6 py-4 font-medium text-foreground">{s.plan.name}</td>
                    <td className="px-6 py-4 text-foreground">₦{Number(s.plan.price).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        s.status === "ACTIVE" ? "bg-success/10 text-success" :
                        s.status === "CANCELLED" ? "bg-destructive/10 text-destructive" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(s.startDate).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" })}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(s.endDate).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" })}
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