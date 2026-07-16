import "dotenv/config";
import { TenantStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";

const GYMS = [
  {
    name: "Zenith Yoga Studio",
    slug: "zenith-yoga-studio",
    plans: [
      { name: "Drop-in Class", price: 5000, durationDays: 1, description: "Single yoga session" },
      { name: "Zenith Monthly", price: 30000, durationDays: 30, description: "Unlimited Yoga Classes" },
      { name: "Mindfulness Package", price: 50000, durationDays: 30, description: "Yoga + Meditation + Spa" },
    ]
  },
  {
    name: "Iron Forge CrossFit",
    slug: "iron-forge-crossfit",
    plans: [
      { name: "Forge Foundation", price: 25000, durationDays: 30, description: "Basic Equipment Access" },
      { name: "WOD Master", price: 40000, durationDays: 30, description: "Unlimited WODs" },
      { name: "Iron Elite", price: 65000, durationDays: 30, description: "WODs + Personal Coaching" },
    ]
  },
  {
    name: "Elite Wellness Club",
    slug: "elite-wellness-club",
    plans: [
      { name: "Club Member", price: 50000, durationDays: 30, description: "Gym & Pool Access" },
      { name: "Premium Wellness", price: 100000, durationDays: 30, description: "Gym, Pool, Spa & Massage" },
      { name: "Platinum Executive", price: 250000, durationDays: 365, description: "Full Year All Access" },
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
