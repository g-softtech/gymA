import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TRIAL_DURATION_DAYS } from "@/lib/billing/pricingConfig";
import { enqueueEmail } from "@/lib/email/emailQueue";

export default async function OnboardingProcessPage() {
  const session = await getAuthSession();

  if (!session?.user?.email || !session?.user?.id) {
    redirect("/auth/signin");
  }

  const pendingSignup = await prisma.pendingSignup.findFirst({
    where: { 
      email: session.user.email,
      status: "PENDING"
    }
  });

  if (!pendingSignup) {
    // If they have no pending signup, they must already have a gym or are a normal user
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { tenant: true }
    });
    
    if (dbUser?.tenant) {
      redirect(`/gym/${dbUser.tenant.slug}/dashboard/admin`);
    } else {
      redirect("/auth/signin");
    }
  }

  // They have a pending signup! Time to provision their gym.
  
  // 1. Resolve Slug Collisions
  let finalSlug = pendingSignup.slug;
  const existingTenant = await prisma.tenant.findUnique({ where: { slug: finalSlug } });
  if (existingTenant) {
    // Slug was taken between initiation and email verification!
    // Append a random string to guarantee uniqueness
    finalSlug = `${finalSlug}-${Math.random().toString(36).substring(2, 6)}`;
  }

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DURATION_DAYS);

  // 2. Perform Atomic Provisioning
  const { tenant } = await prisma.$transaction(async (tx) => {
    // Create the tenant
    const newTenant = await tx.tenant.create({
      data: {
        name: pendingSignup.gymName,
        slug: finalSlug,
        plan: "FREE",
        trialEndsAt,
        planStartedAt: new Date(),
        status: "APPROVED", // Start as approved
      }
    });

    // Create default settings
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

    // Update User (Promote to Admin)
    await tx.user.update({
      where: { id: session.user!.id },
      data: {
        name: pendingSignup.ownerName, // Set their name from the form
        tenantId: newTenant.id,
        role: "ADMIN",
        sessionVersion: { increment: 1 }
      }
    });

    // Mark PendingSignup as COMPLETED
    await tx.pendingSignup.update({
      where: { id: pendingSignup.id },
      data: { status: "COMPLETED" }
    });

    return { tenant: newTenant };
  });

  // 3. Enqueue the Gym Owner Welcome email (fire-and-forget — never blocks)
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
      dashboardUrl: `${process.env.NEXTAUTH_URL}/gym/${tenant.slug}/dashboard/admin`,
    },
  });

  // 4. Send them to the Welcome Setup Wizard
  redirect(`/onboarding/welcome`);
}
