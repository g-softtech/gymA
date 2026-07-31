"use server";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TRIAL_DURATION_DAYS } from "@/lib/billing/pricingConfig";
import { enqueueEmail } from "@/lib/email/emailQueue";
import { createVerificationToken } from "@/lib/auth-tokens";

export async function provisionGymAction() {
  try {
    const session = await getAuthSession();

    if (!session?.user?.email || !session?.user?.id) {
      return { error: "Unauthorized", redirect: "/auth/signin" };
    }

    const pendingSignup = await prisma.pendingSignup.findFirst({
      where: { 
        email: session.user.email,
        status: "PENDING"
      }
    });

    if (!pendingSignup) {
      // If they have no pending signup, check if they already have a gym
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { tenant: true }
      });
      
      if (dbUser?.tenant) {
        return { success: true, alreadyProvisioned: true, slug: dbUser.tenant.slug };
      } else {
        return { error: "No pending signup found", redirect: "/auth/signin" };
      }
    }

    // 1. Resolve Slug Collisions
    let finalSlug = pendingSignup.slug;
    const existingTenant = await prisma.tenant.findUnique({ where: { slug: finalSlug } });
    if (existingTenant) {
      finalSlug = `${finalSlug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DURATION_DAYS);

    // 2. Perform Atomic Provisioning
    const { tenant } = await prisma.$transaction(async (tx) => {
      const newTenant = await tx.tenant.create({
        data: {
          name: pendingSignup.gymName,
          slug: finalSlug,
          plan: "FREE",
          trialEndsAt,
          planStartedAt: new Date(),
          status: "APPROVED",
        }
      });

      await tx.tenantSettings.create({
        data: {
          tenantId: newTenant.id,
          primaryColor: "#6366F1",
          secondaryColor: "#8B5CF6",
          accentColor: "#A78BFA",
          fontFamily: "Inter",
          darkMode: false,
          country: "Nigeria",
        },
      });

      await tx.user.update({
        where: { id: session.user!.id },
        data: {
          name: pendingSignup.ownerName,
          tenantId: newTenant.id,
          role: "ADMIN"
        }
      });

      await tx.pendingSignup.update({
        where: { id: pendingSignup.id },
        data: { status: "COMPLETED" }
      });

      return { tenant: newTenant };
    });

    // 3. Enqueue the Gym Owner Welcome email
    const dashboardUrl = `${process.env.NEXTAUTH_URL}/gym/${tenant.slug}/dashboard/admin`;
    
    let magicUrl: string | undefined;
    try {
      const token = await createVerificationToken(session.user.email!, dashboardUrl);
      magicUrl = `${process.env.NEXTAUTH_URL}/api/auth/callback/email?callbackUrl=${encodeURIComponent(dashboardUrl)}&token=${token}&email=${encodeURIComponent(session.user.email!)}`;
    } catch {
      magicUrl = undefined;
    }

    await enqueueEmail({
      emailType: "GYM_OWNER_WELCOME",
      recipient: session.user.email!,
      subject: `Welcome to CortexFit — ${tenant.name} is live!`,
      tenantId: tenant.id,
      userId: session.user.id,
      payload: {
        ownerName: pendingSignup.ownerName,
        gymName: tenant.name,
        gymSlug: tenant.slug,
        dashboardUrl,
        magicUrl,
      },
    });

    return { success: true, alreadyProvisioned: false };
  } catch (err: any) {
    console.error("Failed to provision gym:", err);
    return { error: "Internal server error", redirect: "/auth/signin" };
  }
}
