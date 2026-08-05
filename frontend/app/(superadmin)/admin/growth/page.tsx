import { prisma } from "@/lib/prisma";
import { formatDistanceToNow, format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function GrowthDashboard() {
  const signups = await prisma.pendingSignup.findMany({
    orderBy: { createdAt: "desc" }
  });

  // Basic KPI calculations
  const totalLeads = signups.length;
  const magicLinksSent = signups.filter(s => s.status === "MAGIC_LINK_SENT" || s.status === "EMAIL_VERIFIED" || s.status === "ONBOARDED").length;
  const onboarded = signups.filter(s => s.status === "ONBOARDED").length;
  const conversionRate = totalLeads > 0 ? ((onboarded / totalLeads) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Growth Funnel</h1>
        <p className="text-muted-foreground mt-2">
          Monitor your customer acquisition pipeline, lead attribution, and conversion metrics.
        </p>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Demo Visitors</h3>
          <p className="text-3xl font-bold mt-2">--</p>
          <p className="text-xs text-muted-foreground mt-1">Analytics pending</p>
        </div>
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm relative overflow-hidden">
          <h3 className="text-sm font-medium text-muted-foreground relative z-10">Qualified Leads</h3>
          <p className="text-3xl font-bold mt-2 relative z-10">{totalLeads}</p>
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>
        </div>
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Magic Links Sent</h3>
          <p className="text-3xl font-bold mt-2">{magicLinksSent}</p>
        </div>
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm relative overflow-hidden">
          <h3 className="text-sm font-medium text-muted-foreground relative z-10">Trials Started</h3>
          <p className="text-3xl font-bold mt-2 text-emerald-600 dark:text-emerald-400 relative z-10">{onboarded}</p>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>
        </div>
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Conversion %</h3>
          <p className="text-3xl font-bold mt-2">{conversionRate}%</p>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20">
          <h2 className="font-semibold text-lg">Lead Pipeline</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Timestamp</th>
                <th className="px-6 py-4 font-medium">Prospect</th>
                <th className="px-6 py-4 font-medium">Gym / Studio</th>
                <th className="px-6 py-4 font-medium">Attribution</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {signups.map((lead) => (
                <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-foreground font-medium">
                      {format(new Date(lead.createdAt), "MMM d, h:mm a")}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(lead.createdAt))} ago
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-foreground">{lead.ownerName}</div>
                    <div className="text-muted-foreground text-xs mt-0.5">{lead.email}</div>
                    {lead.phone && <div className="text-muted-foreground text-xs mt-0.5 flex items-center gap-1">📱 {lead.phone}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-foreground">{lead.gymName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5 items-start">
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 hover:bg-primary/10">
                        {lead.leadSource}
                      </Badge>
                      {lead.demoPersona && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                          Persona: {lead.demoPersona}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge 
                      className={
                        lead.status === "ONBOARDED" 
                          ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/25"
                          : lead.status === "ABANDONED"
                          ? "bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/25"
                          : lead.status === "MAGIC_LINK_SENT"
                          ? "bg-blue-500/15 text-blue-600 border-blue-500/30 hover:bg-blue-500/25"
                          : "bg-amber-500/15 text-amber-600 border-amber-500/30 hover:bg-amber-500/25"
                      }
                      variant="outline"
                    >
                      {lead.status.replace(/_/g, " ")}
                    </Badge>
                  </td>
                </tr>
              ))}
              {signups.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="text-4xl mb-3">🌱</div>
                    <p className="font-medium">No leads yet.</p>
                    <p className="text-sm mt-1">Start driving traffic to your demo funnel!</p>
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
