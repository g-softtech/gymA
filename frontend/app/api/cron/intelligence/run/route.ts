import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateChurnRisk, calculateEngagementScore } from "@/lib/analytics";
import { determineMemberLifecycle } from "@/lib/lifecycle/memberLifecycle";
import { evaluateRetentionTriggers } from "@/lib/automation/retentionEngine";
import { evaluateRevenueOpportunities, RevenueTarget } from "@/lib/revenue/optimizationEngine";
import { ActionRegistry } from "@/lib/actions/actionRegistry";
import { analyticsCache } from "@/lib/cache";

export async function GET(req: Request) {
  try {
    // Only allow cron requests
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Fetch all tenants
    const tenants = await prisma.tenant.findMany();

    const summary = {
      processedTenants: 0,
      retentionCampaignsDispatched: 0,
      atRiskIdentified: 0
    };

    for (const tenant of tenants) {
      const tenantId = tenant.id;
      
      // Fetch members and their active subscriptions
      const members = await prisma.memberProfile.findMany({
        where: { user: { tenantId } },
        include: { subscriptions: { where: { status: "ACTIVE" } } }
      });

      // Batch fetch attendances & bookings
      const attendances = await prisma.attendance.findMany({
        where: { tenantId, checkInTime: { gte: sixtyDaysAgo } }
      });
      const bookings = await prisma.booking.findMany({
        where: { tenantId, date: { gte: thirtyDaysAgo } }
      });

      const tenantActions = [];
      const tenantRiskProfiles = [];

      for (const member of members) {
        const hasActiveSub = member.subscriptions.length > 0;
        const subStart = hasActiveSub ? member.subscriptions[0].startDate : null;
        
        const memberAttendances = attendances.filter(a => a.memberId === member.id);
        const last30 = memberAttendances.filter(a => new Date(a.checkInTime) >= thirtyDaysAgo);
        const prev30 = memberAttendances.filter(a => new Date(a.checkInTime) < thirtyDaysAgo);
        const memberBookings = bookings.filter(b => b.memberId === member.id);

        const lastAttendanceDate = memberAttendances.length > 0 
          ? new Date(Math.max(...memberAttendances.map(a => new Date(a.checkInTime).getTime()))) 
          : null;
        const daysSinceLastAttendance = lastAttendanceDate 
          ? (now.getTime() - lastAttendanceDate.getTime()) / (1000 * 60 * 60 * 24) 
          : null;

        const activeMonths = hasActiveSub ? Math.max(1, Math.round((now.getTime() - subStart!.getTime()) / (30 * 24 * 60 * 60 * 1000))) : 1;

        // 1. Core Analytics
        const { score: churnRiskScore } = calculateChurnRisk(last30, prev30, memberBookings, hasActiveSub);
        const rawEngagementScore = calculateEngagementScore(last30, memberBookings, activeMonths);
        
        // Min-Max normalize relative to tenant max (which we computed in Phase 17.1, but here we can just use raw for classification)
        const engagementScore = rawEngagementScore;

        // 2. Lifecycle Engine
        const lifecycle = determineMemberLifecycle({
          engagementScore,
          churnRiskScore,
          lastAttendance: lastAttendanceDate,
          hasActiveSubscription: hasActiveSub,
          subscriptionStartDate: subStart
        });

        if (lifecycle.stage === "AT_RISK" || lifecycle.stage === "CHURNING") {
          summary.atRiskIdentified++;
          tenantRiskProfiles.push({
            memberId: member.id,
            stage: lifecycle.stage,
            churnRiskScore,
            engagementScore
          });
        }

        // 3. Retention Automation Engine
        const action = evaluateRetentionTriggers({
          stage: lifecycle.stage,
          churnRiskScore,
          engagementScore,
          daysSinceLastAttendance
        });

        if (action.actionType !== "NONE") {
          // Register to DB instead of Cache
          await ActionRegistry.registerAction({
            tenantId,
            actionType: action.actionType,
            targetId: member.id,
            context: action.context
          });
          
          summary.retentionCampaignsDispatched++;
        }
      }

      // 4. Revenue Optimization Engine
      // Evaluate trainers
      const trainers = await prisma.trainerProfile.findMany({ where: { user: { tenantId } } });
      const revenueTargets: RevenueTarget[] = [];
      
      for (const trainer of trainers) {
        const trainerBookings = bookings.filter(b => b.trainerId === trainer.id);
        const totalBookings = trainerBookings.length;
        const attendedBookings = trainerBookings.filter(b => attendances.some(a => a.bookingId === b.id && a.status === "PRESENT")).length;
        const conversionRate = totalBookings > 0 ? attendedBookings / totalBookings : 0;
        const performanceScore = Math.round(conversionRate * 100);
        
        // Approx utilization rate based on bookings vs time
        // Just a simple heuristic for the cron
        const utilizationRate = totalBookings > 10 ? 95 : (totalBookings * 10); 

        revenueTargets.push({
          id: trainer.id,
          type: "TRAINER",
          performanceScore,
          utilizationRate
        });
      }

      const revenueRecommendations = evaluateRevenueOpportunities(revenueTargets);

      for (const rec of revenueRecommendations) {
        await ActionRegistry.registerAction({
          tenantId,
          actionType: rec.type,
          targetId: rec.targetId,
          context: rec.reason
        });
      }

      // Expire stale actions
      await ActionRegistry.expireStaleActions();

      // 5. Cache Results for Admin APIs (Only Risk profiles, actions are now fetched from DB)
      analyticsCache.set(`tenant:${tenantId}:intelligence:risks`, tenantRiskProfiles, 12 * 60 * 60);

      summary.processedTenants++;
    }

    return NextResponse.json({ success: true, summary });

  } catch (error) {
    console.error("Intelligence Cron Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
