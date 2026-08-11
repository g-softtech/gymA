import { prisma } from "@/lib/prisma";
import { TenantPlan } from "@prisma/client";
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

  // Randomly distribute SaaS plans for diverse analytics
  const availablePlans: TenantPlan[] = ["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"];
  const randomPlan = availablePlans[Math.floor(Math.random() * availablePlans.length)];

  const tenant = await prisma.$transaction(async (tx) => {
    const tenantRecord = await tx.tenant.create({
      data: {
        name: gymName,
        slug,
        isDemo: true, // Marks this as a Sandbox
        status: "APPROVED",
        plan: randomPlan,
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

    const premiumPlan = await tx.membershipPlan.create({
      data: {
        tenantId: tenantRecord.id,
        name: "Premium Quarterly",
        price: 70000,
        currency: "NGN",
        durationDays: 90,
        isActive: true,
        features: ["All classes included", "1 PT Session/mo"],
      },
    });

    const annualPlan = await tx.membershipPlan.create({
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

    const plans = [standardPlan, premiumPlan, annualPlan];

    // Class Sessions
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(18, 0, 0, 0);

    const hiitClass = await tx.classSession.create({
      data: {
        tenantId: tenantRecord.id,
        title: "Morning HIIT",
        instructorId: trainer.id,
        startTime: tomorrow,
        durationMins: 45,
        capacity: 20,
      }
    });

    const strengthClass = await tx.classSession.create({
      data: {
        tenantId: tenantRecord.id,
        title: "Evening Strength",
        instructorId: trainer.id,
        startTime: nextWeek,
        durationMins: 60,
        capacity: 15,
      }
    });

    // Generate Members
    const allMembers: { user: any, profile: any }[] = [];

    // Single specific member for impersonation
    const mainMemberUser = await tx.user.create({
      data: {
        name: `${gymName} Member`,
        email: memberEmail,
        password: hashedPassword,
        role: "MEMBER",
        tenantId: tenantRecord.id,
      },
    });
    const mainProfile = await tx.memberProfile.create({ data: { userId: mainMemberUser.id, weightKg: 75, heightCm: 180 } });
    allMembers.push({ user: mainMemberUser, profile: mainProfile });

    // Additional generic dummy members (19 more to make 20 total)
    for (let i = 2; i <= 20; i++) {
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
        data: { userId: dummyUser.id, weightKg: 65 + (i % 20), heightCm: 160 + (i % 30) }
      });
      allMembers.push({ user: dummyUser, profile: dummyProfile });
    }

    // Distribute Subscriptions and Generate Data
    for (let i = 0; i < allMembers.length; i++) {
      const { profile } = allMembers[i];
      const plan = plans[i % plans.length]; // Distribute evenly
      
      // Subscription
      await tx.subscription.create({
        data: {
          memberId: profile.id,
          planId: plan.id,
          tenantId: tenantRecord.id,
          status: "ACTIVE",
          startDate: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)), // staggered starts
          endDate: new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000),
        },
      });

      // Progress Record
      await tx.progressRecord.create({
        data: {
          memberId: profile.id,
          tenantId: tenantRecord.id,
          recordedBy: profile.id,
          weightKg: profile.weightKg! - (i % 5),
          bodyFatPct: 15 + (i % 10),
          notes: "Initial reading",
        }
      });

      // Food Log
      await tx.foodLog.create({
        data: {
          memberId: profile.id,
          tenantId: tenantRecord.id,
          mealType: "Breakfast",
          foodName: "Oatmeal and Eggs",
          calories: 450,
          protein: 25,
          carbs: 50,
          fats: 15,
        }
      });

      // Workout Plan
      await tx.workoutPlan.create({
        data: {
          memberId: profile.id,
          trainerId: trainer.id,
          tenantId: tenantRecord.id,
          title: "Full Body Foundation",
          routines: [
            { day: "Monday", exercises: ["Squats 3x10", "Bench Press 3x10"] },
            { day: "Wednesday", exercises: ["Deadlifts 3x8", "Pullups 3x8"] },
          ]
        }
      });

      // Bookings & Attendances
      if (i % 2 === 0) {
        // Book a class
        await tx.booking.create({
          data: {
            memberId: profile.id,
            tenantId: tenantRecord.id,
            classSessionId: hiitClass.id,
            date: hiitClass.startTime,
            status: "CONFIRMED",
          }
        });
        
        // Past attendance for past sessions (mocking past attendance for metrics)
        const pastDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        await tx.attendance.create({
          data: {
            memberId: profile.id,
            tenantId: tenantRecord.id,
            checkInTime: pastDate,
            method: "QR",
            status: "PRESENT",
            type: "GENERAL"
          }
        });
      } else {
        // Book a class
        await tx.booking.create({
          data: {
            memberId: profile.id,
            tenantId: tenantRecord.id,
            classSessionId: strengthClass.id,
            date: strengthClass.startTime,
            status: "CONFIRMED",
          }
        });
        // Book a PT Session
        await tx.booking.create({
          data: {
            memberId: profile.id,
            tenantId: tenantRecord.id,
            trainerId: trainer.id,
            date: tomorrow,
            sessionType: "PHYSICAL",
            status: "CONFIRMED",
          }
        });
      }
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
