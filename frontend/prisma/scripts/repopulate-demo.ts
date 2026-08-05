import dotenv from "dotenv";
dotenv.config();
dotenv.config({ path: ".env.local", override: true });

import crypto from "crypto";
import bcrypt from "bcryptjs";

async function repopulateDemo() {
  const { prisma } = await import("../../lib/prisma");

  const tenant = await prisma.tenant.findUnique({
    where: { slug: "demo-elite" },
    include: {
      users: { where: { role: "ADMIN" } },
    }
  });

  if (!tenant) {
    console.error("Live Demo tenant not found!");
    return;
  }

  const admin = tenant.users[0];
  if (!admin) {
    console.error("No Admin found for demo tenant!");
    return;
  }

  console.log(`Found Live Demo: ${tenant.name}`);

  // 1. Wipe old data
  console.log("Wiping old mock data...");
  await prisma.post.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.workoutPlan.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.attendance.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.booking.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.subscription.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.transaction.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.progressRecord.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.foodLog.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.mealPlan.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.classSession.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.membershipPlan.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.memberProfile.deleteMany({ where: { user: { tenantId: tenant.id } } });
  await prisma.trainerProfile.deleteMany({ where: { user: { tenantId: tenant.id } } });
  await prisma.user.deleteMany({ where: { tenantId: tenant.id, role: { notIn: ["SUPERADMIN", "ADMIN"] } } });

  // 2. Generate New Data
  console.log("Generating new rich data...");
  const tempPassword = crypto.randomBytes(16).toString("hex");
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  const tx = prisma;
    // Trainer User
    const trainer = await tx.user.create({
      data: {
        name: `Coach John`,
        email: `trainer@demo.cortexfit.com`,
        password: hashedPassword,
        role: "TRAINER",
        tenantId: tenant.id,
      },
    });

    const trainerProfile = await tx.trainerProfile.create({
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
        tenantId: tenant.id,
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
        tenantId: tenant.id,
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
        tenantId: tenant.id,
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
        tenantId: tenant.id,
        title: "Morning HIIT",
        instructorId: trainerProfile.id,
        startTime: tomorrow,
        durationMins: 45,
        capacity: 20,
      }
    });

    const strengthClass = await tx.classSession.create({
      data: {
        tenantId: tenant.id,
        title: "Evening Strength",
        instructorId: trainerProfile.id,
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
        name: `Test Member`,
        email: `member@demo.cortexfit.com`,
        password: hashedPassword,
        role: "MEMBER",
        tenantId: tenant.id,
      },
    });
    const mainProfile = await tx.memberProfile.create({ data: { userId: mainMemberUser.id, weightKg: 75, heightCm: 180 } });
    allMembers.push({ user: mainMemberUser, profile: mainProfile });

    // Additional generic dummy members (19 more to make 20 total)
    for (let i = 2; i <= 20; i++) {
      const dummyUser = await tx.user.create({
        data: {
          name: `Test Member ${i}`,
          email: `member${i}@demo.cortexfit.com`,
          password: hashedPassword,
          role: "MEMBER",
          tenantId: tenant.id,
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
          tenantId: tenant.id,
          status: "ACTIVE",
          startDate: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)), // staggered starts
          endDate: new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000),
        },
      });

      // Progress Record
      await tx.progressRecord.create({
        data: {
          memberId: profile.id,
          tenantId: tenant.id,
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
          tenantId: tenant.id,
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
          trainerId: trainerProfile.id,
          tenantId: tenant.id,
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
            tenantId: tenant.id,
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
            tenantId: tenant.id,
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
            tenantId: tenant.id,
            classSessionId: strengthClass.id,
            date: strengthClass.startTime,
            status: "CONFIRMED",
          }
        });
        // Book a PT Session
        await tx.booking.create({
          data: {
            memberId: profile.id,
            tenantId: tenant.id,
            trainerId: trainerProfile.id,
            date: tomorrow,
            sessionType: "PHYSICAL",
            status: "CONFIRMED",
          }
        });
      }
    }
  console.log("Successfully repopulated Live Demo!");
}

repopulateDemo()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
