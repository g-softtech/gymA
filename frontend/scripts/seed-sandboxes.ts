import "dotenv/config";
import { TenantStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";

const GYMS = [
  {
    name: "Bodyline Fitness & Gym",
    slug: "bodyline-fitness",
    plans: [
      { name: "Day Pass", price: 5000, durationDays: 1, description: "Single day access to all facilities" },
      { name: "Monthly Membership", price: 35000, durationDays: 30, description: "Unlimited access to gym, pool, and spa" },
      { name: "Annual Membership", price: 300000, durationDays: 365, description: "Full year premium access with personal training" },
    ]
  },
  {
    name: "Bodyrox Fitness Studio",
    slug: "bodyrox-fitness",
    plans: [
      { name: "Walk-in Class", price: 4000, durationDays: 1, description: "Drop in for any group class" },
      { name: "Monthly Pro", price: 40000, durationDays: 30, description: "Unlimited gym access and group classes" },
      { name: "Quarterly Access", price: 110000, durationDays: 90, description: "3 months of elite fitness" },
    ]
  },
  {
    name: "iFitness Abuja",
    slug: "ifitness-abuja",
    plans: [
      { name: "Basic Monthly", price: 25000, durationDays: 30, description: "Access to the main gym floor" },
      { name: "Premium Monthly", price: 35000, durationDays: 30, description: "Multi-branch access + fitness classes" },
      { name: "Annual Access", price: 250000, durationDays: 365, description: "12 months of unrestricted access" },
    ]
  }
];

const NAMES = [
  "Adebayo Ojo", "Chizoba Nwachukwu", "Halima Abubakar", "Emeka Ibe", "Titilayo Adeyemi",
  "Kingsley Udo", "Binta Bello", "Folake Williams", "Tariq Usman", "Ngozi Chukwu",
  "Uchenna Eze", "Fatima Hassan", "Dare Olatunji", "Chioma Okafor", "Yusuf Mohammed"
];

async function main() {
  console.log("Starting Mass Sandbox Seeding...");

  for (const gym of GYMS) {
    console.log(`\n--- Seeding: ${gym.name} (${gym.slug}) ---`);
    
    // Clean up if exists
    try {
      await prisma.user.deleteMany({ where: { email: { endsWith: `@${gym.slug}.demo` } } });
      await prisma.tenant.delete({ where: { slug: gym.slug } });
    } catch (e) {
      // Ignore
    }

    // Create Tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: gym.name,
        slug: gym.slug,
        isDemo: true,
        isActive: true,
        status: "APPROVED" as TenantStatus,
      },
    });

    // Create Plans
    const createdPlans = [];
    for (const p of gym.plans) {
      const plan = await prisma.membershipPlan.create({ 
        data: { ...p, tenantId: tenant.id, isActive: true } 
      });
      createdPlans.push(plan);
    }

    // Helpers
    const today = new Date();
    const subtractDays = (days: number) => new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
    const addDays = (days: number) => new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

    // Create 15 Members per gym
    for (let i = 0; i < 15; i++) {
      const isExpired = i >= 10 && i < 13;
      const isSuspended = i >= 13;
      const isActive = i < 10;
      
      const status = isActive ? "ACTIVE" : (isExpired ? "EXPIRED" : "SUSPENDED");
      const plan = createdPlans[i % createdPlans.length];

      // Create User
      const user = await prisma.user.create({
        data: {
          name: NAMES[i],
          email: `member${i}@${gym.slug}.demo`,
          role: "MEMBER",
          tenantId: tenant.id,
        }
      });

      // Create Profile
      const profile = await prisma.memberProfile.create({
        data: { userId: user.id }
      });

      // Create Subscription
      let startDate, endDate;
      if (isActive) {
        const daysLeft = Math.floor(Math.random() * 20) + 1;
        startDate = subtractDays(30 - daysLeft);
        endDate = addDays(daysLeft);
      } else if (isExpired) {
        const daysExpired = Math.floor(Math.random() * 10) + 1;
        startDate = subtractDays(30 + daysExpired);
        endDate = subtractDays(daysExpired);
      } else {
        startDate = subtractDays(60);
        endDate = subtractDays(30);
      }

      await prisma.subscription.create({
        data: {
          memberId: profile.id,
          tenantId: tenant.id,
          planId: plan.id,
          status: status as any,
          startDate,
          endDate,
        }
      });

      // Create Attendances
      if (isActive || isExpired) {
        const attendanceCount = isActive ? Math.floor(Math.random() * 10) + 5 : Math.floor(Math.random() * 3);
        for (let j = 0; j < attendanceCount; j++) {
          await prisma.attendance.create({
            data: {
              memberId: profile.id,
              tenantId: tenant.id,
              checkInTime: subtractDays(j * 3 + 1),
              method: "MANUAL",
              type: "GENERAL",
            }
          });
        }
      }
    }
    
    console.log(`✅ Sandbox ready at /sandbox/${gym.slug}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
