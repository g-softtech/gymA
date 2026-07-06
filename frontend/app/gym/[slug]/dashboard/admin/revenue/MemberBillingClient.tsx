"use client";

import React, { useState, useMemo } from "react";
import { 
  Users, AlertCircle, CheckCircle, Clock, XCircle, Ban, 
  DollarSign, TrendingUp, Calendar, CreditCard, Search, Filter 
} from "lucide-react";

type SubscriptionData = {
  id: string;
  memberName: string;
  memberEmail: string;
  memberAvatar?: string | null;
  planName: string;
  status: "ACTIVE" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "PENDING_PAYMENT" | "REPLACED";
  price: number;
  startDate: string;
  endDate: string;
  outstandingBalance: number;
  lastPaymentDate?: string | null;
};

type BillingMetrics = {
  // Membership Health
  activeMembers: number;
  trialMembers: number;
  pendingPayment: number;
  suspended: number;
  cancelled: number;
  expired: number;
  
  // Renewals
  expiresToday: number;
  expiresIn3Days: number;
  expiresIn7Days: number;
  autoRenewTomorrow: number;
  
  // Financial
  mrr: number;
  expectedRenewalRevenue: number;
  collectedThisMonth: number;
  outstandingBalance: number;

  // Alerts
  alerts: { type: "warning" | "error" | "success" | "info"; message: string }[];
};

export default function MemberBillingClient({
  metrics,
  subscriptions,
}: {
  metrics: BillingMetrics;
  subscriptions: SubscriptionData[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredSubs = useMemo(() => {
    return subscriptions.filter(sub => {
      const matchesSearch = sub.memberName.toLowerCase().includes(search.toLowerCase()) || 
                            sub.memberEmail.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || sub.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [subscriptions, search, statusFilter]);

  const StatusBadge = ({ status }: { status: string }) => {
    const config: Record<string, { color: string, label: string, icon: React.ReactNode }> = {
      ACTIVE: { color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", label: "Active", icon: <CheckCircle className="w-3 h-3 mr-1" /> },
      PENDING_PAYMENT: { color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", label: "Pending", icon: <Clock className="w-3 h-3 mr-1" /> },
      EXPIRED: { color: "bg-red-500/10 text-red-500 border-red-500/20", label: "Expired", icon: <XCircle className="w-3 h-3 mr-1" /> },
      SUSPENDED: { color: "bg-stone-500/10 text-stone-500 border-stone-500/20", label: "Suspended", icon: <Ban className="w-3 h-3 mr-1" /> },
      CANCELLED: { color: "bg-gray-800 text-gray-300 border-gray-700", label: "Cancelled", icon: <XCircle className="w-3 h-3 mr-1" /> },
      REPLACED: { color: "bg-blue-500/10 text-blue-500 border-blue-500/20", label: "Replaced", icon: <CheckCircle className="w-3 h-3 mr-1" /> },
    };

    const c = config[status] || { color: "bg-gray-100 text-gray-600 border-gray-200", label: status, icon: null };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${c.color}`}>
        {c.icon}
        {c.label}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "NGN" }).format(amount).replace("NGN", "₦");
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Member Billing Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Operational view of gym revenue, member health, and upcoming renewals.</p>
        </div>
        
        {/* Simple Revenue Trend Visualization */}
        <div className="bg-card text-card-foreground border border-border px-4 py-2 rounded-xl flex items-center gap-4 shadow-sm">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Revenue (30d)</p>
            <div className="flex items-end gap-1 h-8 mt-1">
              {[40, 60, 45, 80, 55, 90, 75, 100, 85, 95].map((h, i) => (
                <div key={i} className="w-2 bg-primary/80 rounded-t-sm transition-all hover:bg-primary" style={{ height: `${h}%` }}></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Alerts */}
      {metrics.alerts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.alerts.map((alert, i) => {
            const isWarning = alert.type === "warning";
            const isError = alert.type === "error";
            const isSuccess = alert.type === "success";
            return (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-sm ${
                isWarning ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400" :
                isError ? "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400" :
                isSuccess ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" :
                "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
              }`}>
                {isWarning && <AlertCircle className="w-5 h-5" />}
                {isError && <XCircle className="w-5 h-5" />}
                {isSuccess && <CheckCircle className="w-5 h-5" />}
                <span className="text-sm font-medium">{alert.message}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Membership Health */}
        <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-4">
            <Users className="w-4 h-4" /> Membership Health
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Active Members</p>
              <p className="text-2xl font-bold text-emerald-500">{metrics.activeMembers}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending Payment</p>
              <p className="text-2xl font-bold text-amber-500">{metrics.pendingPayment}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Expired</p>
              <p className="text-2xl font-bold text-red-500">{metrics.expired}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Suspended</p>
              <p className="text-2xl font-bold text-stone-500">{metrics.suspended}</p>
            </div>
          </div>
        </div>

        {/* Financial KPIs */}
        <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4" /> Financial KPIs
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-muted-foreground">Monthly Recurring Revenue (MRR)</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(metrics.mrr)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Outstanding Balance</p>
                <p className="text-lg font-bold text-amber-500">{formatCurrency(metrics.outstandingBalance)}</p>
              </div>
            </div>
            <div className="flex justify-between items-end pt-2 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground">Expected Renewals (30d)</p>
                <p className="text-sm font-bold text-foreground">{formatCurrency(metrics.expectedRenewalRevenue)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Collected This Month</p>
                <p className="text-sm font-bold text-emerald-500">{formatCurrency(metrics.collectedThisMonth)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Renewals */}
        <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4" /> Upcoming Renewals
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Expires Today</p>
              <p className="text-2xl font-bold text-orange-500">{metrics.expiresToday}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Expires in 3 Days</p>
              <p className="text-2xl font-bold text-amber-500">{metrics.expiresIn3Days}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Expires in 7 Days</p>
              <p className="text-2xl font-bold text-blue-500">{metrics.expiresIn7Days}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Auto-Renew Tomorrow</p>
              <p className="text-2xl font-bold text-emerald-500">{metrics.autoRenewTomorrow}</p>
            </div>
          </div>
        </div>

      </div>

      {/* Member Table Section */}
      <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search member name or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto py-2 pl-3 pr-8 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING_PAYMENT">Pending Payment</option>
              <option value="EXPIRED">Expired</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/10 text-muted-foreground">
                <th className="text-left px-6 py-4 font-semibold uppercase tracking-wider text-xs">Member</th>
                <th className="text-left px-6 py-4 font-semibold uppercase tracking-wider text-xs">Plan</th>
                <th className="text-left px-6 py-4 font-semibold uppercase tracking-wider text-xs">Status</th>
                <th className="text-left px-6 py-4 font-semibold uppercase tracking-wider text-xs">Amount</th>
                <th className="text-left px-6 py-4 font-semibold uppercase tracking-wider text-xs">Next Billing</th>
                <th className="text-left px-6 py-4 font-semibold uppercase tracking-wider text-xs">Outstanding</th>
                <th className="text-right px-6 py-4 font-semibold uppercase tracking-wider text-xs">Last Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredSubs.length > 0 ? filteredSubs.map((sub) => (
                <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {sub.memberName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{sub.memberName}</p>
                        <p className="text-xs text-muted-foreground">{sub.memberEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium">{sub.planName}</td>
                  <td className="px-6 py-4"><StatusBadge status={sub.status} /></td>
                  <td className="px-6 py-4 font-medium text-foreground">{formatCurrency(sub.price)}</td>
                  <td className="px-6 py-4 text-muted-foreground">{new Date(sub.endDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    {sub.outstandingBalance > 0 ? (
                      <span className="text-amber-500 font-bold">{formatCurrency(sub.outstandingBalance)}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-muted-foreground">
                    {sub.lastPaymentDate ? new Date(sub.lastPaymentDate).toLocaleDateString() : "Never"}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <CreditCard className="w-8 h-8 text-muted-foreground/30 mb-2" />
                      <p>No subscriptions found matching your filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
