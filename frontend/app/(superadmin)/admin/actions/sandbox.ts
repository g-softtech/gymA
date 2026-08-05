"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { generateSandbox } from "@/lib/sandbox/generate";
import { revalidatePath } from "next/cache";

export async function generateSandboxAction(formData: FormData) {
  const session = await getAuthSession();
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    throw new Error("Unauthorized");
  }

  const gymName = formData.get("gymName") as string;
  const logoUrl = formData.get("logoUrl") as string | null;
  const primaryColor = formData.get("primaryColor") as string | null;

  if (!gymName) {
    throw new Error("Gym Name is required");
  }

  const result = await generateSandbox({
    gymName,
    logoUrl: logoUrl || undefined,
    primaryColor: primaryColor || undefined,
  });

  revalidatePath("/admin/tenants");
  return { success: true, ...result };
}

export async function resetSandboxAction(tenantId: string) {
  const session = await getAuthSession();
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    throw new Error("Unauthorized");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { settings: true }
  });

  if (!tenant || !tenant.isDemo) {
    throw new Error("Cannot reset a non-sandbox tenant");
  }

  if (tenant.slug === "demo-elite") {
    throw new Error("Cannot reset the public Live Demo. It is protected.");
  }

  // 1. Delete all non-superadmin data for this tenant
  await prisma.$transaction([
    prisma.post.deleteMany({ where: { tenantId } }),
    prisma.workoutPlan.deleteMany({ where: { tenantId } }),
    prisma.attendance.deleteMany({ where: { tenantId } }),
    prisma.booking.deleteMany({ where: { tenantId } }),
    prisma.subscription.deleteMany({ where: { tenantId } }),
    prisma.classSession.deleteMany({ where: { tenantId } }),
    prisma.membershipPlan.deleteMany({ where: { tenantId } }),
    prisma.memberProfile.deleteMany({ where: { user: { tenantId } } }),
    prisma.trainerProfile.deleteMany({ where: { user: { tenantId } } }),
    prisma.user.deleteMany({ where: { tenantId, role: { not: "SUPERADMIN" } } }),
    prisma.tenant.delete({ where: { id: tenantId } })
  ]);

  // 2. Re-generate it using the same core details
  await generateSandbox({
    gymName: tenant.name,
    logoUrl: tenant.settings?.logoUrl || undefined,
    primaryColor: tenant.settings?.primaryColor || undefined,
  });

  revalidatePath("/admin/tenants");
  return { success: true };
}

export async function deleteSandboxAction(tenantId: string) {
  const session = await getAuthSession();
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    throw new Error("Unauthorized");
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant || !tenant.isDemo) {
    throw new Error("Cannot delete a non-sandbox tenant");
  }

  if (tenant.slug === "demo-elite") {
    throw new Error("Cannot delete the public Live Demo. It is protected.");
  }

  // Transactionally delete everything related to this tenant
  await prisma.$transaction([
    prisma.post.deleteMany({ where: { tenantId } }),
    prisma.workoutPlan.deleteMany({ where: { tenantId } }),
    prisma.attendance.deleteMany({ where: { tenantId } }),
    prisma.booking.deleteMany({ where: { tenantId } }),
    prisma.subscription.deleteMany({ where: { tenantId } }),
    prisma.classSession.deleteMany({ where: { tenantId } }),
    prisma.membershipPlan.deleteMany({ where: { tenantId } }),
    prisma.memberProfile.deleteMany({ where: { user: { tenantId } } }),
    prisma.trainerProfile.deleteMany({ where: { user: { tenantId } } }),
    prisma.user.deleteMany({ where: { tenantId, role: { not: "SUPERADMIN" } } }),
    prisma.tenantSettings.deleteMany({ where: { tenantId } }),
    prisma.tenant.delete({ where: { id: tenantId } })
  ]);

  revalidatePath("/admin/tenants");
  return { success: true };
}
