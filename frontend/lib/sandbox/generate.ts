import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import bcrypt from "bcryptjs";

interface GenerateSandboxInput {
  gymName: string;
  logoUrl?: string;
  primaryColor?: string;
}

export async function generateSandbox({
  gymName,
  logoUrl,
  primaryColor,
}: GenerateSandboxInput) {
  const baseSlug = gymName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  let slug = baseSlug;
  let isUnique = false;

  while (!isUnique) {
    const existing = await prisma.tenant.findUnique({ where: { slug } });
    if (!existing) {
      isUnique = true;
    } else {
      const suffix = crypto.randomBytes(2).toString("hex");
      slug = `${baseSlug}-demo-${suffix}`;
    }
  }

  const adminEmail = `admin@${slug}.test`;
  const trainerEmail = `trainer@${slug}.test`;
  const memberEmail = `member@${slug}.test`;
  
  // This password is never used in the UI, but satisfies DB constraints
  const tempPassword = crypto.randomBytes(16).toString("hex");
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  const tenant = await prisma.$transaction(async (tx) => {
    const tenantRecord = await tx.tenant.create({
      data: {
        name: gymName,
        slug,
        isDemo: true, // Marks this as a Sandbox
        status: "APPROVED",
        settings: {
          create: {
            logoUrl: logoUrl || "/sandbox-logos/default.png",
            primaryColor: primaryColor || "#3b82f6",
            description: `A premier automated sandbox environment for ${gymName}.`,
          },
        },
      },
    });

    // Admin User
    await tx.user.create({
      data: {
        name: `${gymName} Owner`,
        email: adminEmail,
        password: hashedPassword,
        role: "ADMIN",
        tenantId: tenantRecord.id,
      },
    });

    // Trainer User
    const trainer = await tx.user.create({
      data: {
        name: `Coach ${gymName.split(" ")[0]}`,
        email: trainerEmail,
        password: hashedPassword,
        role: "TRAINER",
        tenantId: tenantRecord.id,
      },
    });

    await tx.trainerProfile.create({
      data: {
        userId: trainer.id,
        specialties: ["CrossFit", "Strength"],
        availability: {
          monday: ["06:00", "07:00", "08:00", "16:00", "17:00"],
          wednesday: ["06:00", "07:00", "08:00", "16:00", "17:00"],
          friday: ["06:00", "07:00", "08:00"],
        },
        hourlyRate: 15000,
        showOnWebsite: true,
      },
    });

    // Membership Plans
    const standardPlan = await tx.membershipPlan.create({
      data: {
        tenantId: tenantRecord.id,
        name: "Standard Monthly",
        price: 25000,
        currency: "NGN",
        durationDays: 30,
        isActive: true,
        features: ["Access to gym floor", "Locker room access"],
      },
    });

    await tx.membershipPlan.create({
      data: {
        tenantId: tenantRecord.id,
        name: "Annual VIP",
        price: 250000,
        currency: "NGN",
        durationDays: 365,
        isActive: true,
        features: ["All classes included", "Free towel service", "Guest pass"],
      },
    });

    // Class Sessions
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(18, 0, 0, 0);

    await tx.classSession.createMany({
      data: [
        {
          tenantId: tenantRecord.id,
          title: "Morning HIIT",
          instructorId: trainer.id,
          startTime: tomorrow,
          durationMins: 45,
          capacity: 20,
        },
        {
          tenantId: tenantRecord.id,
          title: "Evening Strength",
          instructorId: trainer.id,
          startTime: nextWeek,
          durationMins: 60,
          capacity: 15,
        },
      ],
    });

    // Single specific member for impersonation
    const memberUser = await tx.user.create({
      data: {
        name: `${gymName} Member`,
        email: memberEmail,
        password: hashedPassword,
        role: "MEMBER",
        tenantId: tenantRecord.id,
      },
    });

    const profile = await tx.memberProfile.create({
      data: {
        userId: memberUser.id,
      },
    });

    await tx.subscription.create({
      data: {
        memberId: profile.id,
        planId: standardPlan.id,
        tenantId: tenantRecord.id,
        status: "ACTIVE",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    
    // Additional generic dummy members
    for (let i = 2; i <= 5; i++) {
      const dummyUser = await tx.user.create({
        data: {
          name: `Test Member ${i}`,
          email: `member${i}@${slug}.test`,
          password: hashedPassword,
          role: "MEMBER",
          tenantId: tenantRecord.id,
        }
      });
      const dummyProfile = await tx.memberProfile.create({
        data: { userId: dummyUser.id }
      });
      await tx.subscription.create({
        data: {
          memberId: dummyProfile.id,
          planId: standardPlan.id,
          tenantId: tenantRecord.id,
          status: "ACTIVE",
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }
      });
    }

    return tenantRecord;
  });

  return {
    tenant,
    adminEmail,
    trainerEmail,
    memberEmail,
  };
}
