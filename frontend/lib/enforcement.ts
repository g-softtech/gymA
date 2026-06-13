import { prisma } from "@/lib/prisma";
import { getTenantLimits } from "@/lib/billing";

export async function checkAiQuota(tenantId: string): Promise<{ allowed: boolean; reason?: string }> {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return { allowed: false, reason: "Tenant not found" };

  const limits = getTenantLimits(tenant.plan);

  if (limits.maxAiRequests === 0) return { allowed: false, reason: "AI features are not included in your current plan." };
  
  if (limits.maxAiRequests > 100000) return { allowed: true };

  const now = new Date();
  
  if (tenant.plan === "FREE") {
    const aiUsage = await prisma.aiLog.count({ where: { tenantId } });
    if (aiUsage >= limits.maxAiRequests) {
      return { allowed: false, reason: "Free trial AI quota exceeded. Upgrade to a paid plan." };
    }
  } else {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const aiUsage = await prisma.aiLog.count({
      where: {
        tenantId,
        createdAt: { gte: startOfMonth },
      },
    });
    if (aiUsage >= limits.maxAiRequests) {
      return { allowed: false, reason: "Monthly AI quota exceeded. Please upgrade your plan." };
    }
  }

  return { allowed: true };
}

export async function checkMemberQuota(tenantId: string): Promise<{ allowed: boolean; reason?: string }> {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return { allowed: false, reason: "Tenant not found" };

  const limits = getTenantLimits(tenant.plan);
  const memberCount = await prisma.user.count({ where: { tenantId, role: "MEMBER" } });

  if (memberCount >= limits.maxMembers) {
    return { allowed: false, reason: `Member limit reached (${limits.maxMembers}). Please upgrade your plan to add more members.` };
  }
  return { allowed: true };
}

export async function checkTrainerQuota(tenantId: string): Promise<{ allowed: boolean; reason?: string }> {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return { allowed: false, reason: "Tenant not found" };

  const limits = getTenantLimits(tenant.plan);
  const trainerCount = await prisma.user.count({ where: { tenantId, role: "TRAINER" } });

  if (trainerCount >= limits.maxTrainers) {
    return { allowed: false, reason: `Trainer limit reached (${limits.maxTrainers}). Please upgrade your plan to add more trainers.` };
  }
  return { allowed: true };
}
