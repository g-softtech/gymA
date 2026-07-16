import "dotenv/config";
import { TenantStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("Starting Demo Sandbox Seed...");

  const SLUG = "eco-fitness-hub";

  // 1. Clean up existing demo data if any
  const existingTenant = await prisma.tenant.findUnique({ where: { slug: SLUG } });
  if (existingTenant) {
    console.log("Cleaning up existing demo tenant...");
    await prisma.tenant.delete({ where: { slug: SLUG } });
  }

  // 2. Create the Demo Tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: "Eco Fitness Hub",
      slug: SLUG,
      isDemo: true,
      isActive: true,
      status: "APPROVED" as TenantStatus,
    },
  });
  console.log(`Created Tenant: ${tenant.name} (${tenant.id})`);

  // 3. Create Plans
  const plansData = [
    { name: "Eco Lite", price: 15000, durationDays: 30, description: "Basic access to gym equipment", tenantId: tenant.id, isActive: true },
    { name: "Eco Standard", price: 25000, durationDays: 30, description: "Gym + Group Classes", tenantId: tenant.id, isActive: true },
    { name: "Eco Premium", price: 40000, durationDays: 30, description: "All access + 1 Trainer Session", tenantId: tenant.id, isActive: true },
    { name: "VIP Elite Club", price: 75000, durationDays: 30, description: "All access + Personal Coach + Spa", tenantId: tenant.id, isActive: true },
  ];

  const plans = [];
  for (const p of plansData) {
    const plan = await prisma.membershipPlan.create({ data: p });
    plans.push(plan);
  }
  console.log(`Created 4 Membership Plans.`);

  // Helpers
  const today = new Date();
  const subtractDays = (days: number) => new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
  const addDays = (days: number) => new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

  // 4. Create Members
  const membersConfig = [
    // 9 ACTIVE
    { name: "Chidi Okafor", email: "chidi@eco.demo", planIndex: 0, status: "ACTIVE", daysLeft: 12 },
    { name: "Yinka Balogun", email: "yinka@eco.demo", planIndex: 1, status: "ACTIVE", daysLeft: 20 },
    { name: "Amara Egwu", email: "amara@eco.demo", planIndex: 2, status: "ACTIVE", daysLeft: 5 },
    { name: "Tunde Bakare", email: "tunde@eco.demo", planIndex: 3, status: "ACTIVE", daysLeft: 28 },
    { name: "Ngozi Adeleke", email: "ngozi@eco.demo", planIndex: 1, status: "ACTIVE", daysLeft: 15 },
    { name: "Emeka Uzo", email: "emeka@eco.demo", planIndex: 0, status: "ACTIVE", daysLeft: 2 },
    { name: "Fatima Yusuf", email: "fatima@eco.demo", planIndex: 2, status: "ACTIVE", daysLeft: 25 },
    { name: "Dayo Ojo", email: "dayo@eco.demo", planIndex: 1, status: "ACTIVE", daysLeft: 18 },
    { name: "Kemi Adeyemi", email: "kemi@eco.demo", planIndex: 3, status: "ACTIVE", daysLeft: 10 },
    // 4 EXPIRED
    { name: "Bayo Olatunji", email: "bayo@eco.demo", planIndex: 1, status: "EXPIRED", daysExpired: 5 },
    { name: "Chioma Nwosu", email: "chioma@eco.demo", planIndex: 0, status: "EXPIRED", daysExpired: 12 },
    { name: "Obinna Eze", email: "obinna@eco.demo", planIndex: 2, status: "EXPIRED", daysExpired: 2 },
    { name: "Zainab Bello", email: "zainab@eco.demo", planIndex: 1, status: "EXPIRED", daysExpired: 20 },
    // 2 SUSPENDED
    { name: "Ifeanyi Okoro", email: "ifeanyi@eco.demo", planIndex: 3, status: "SUSPENDED", reason: "Multiple failed payments" },
    { name: "Simi Makinde", email: "simi@eco.demo", planIndex: 2, status: "SUSPENDED", reason: "Zero attendance for 3 months" },
  ];

  for (const config of membersConfig) {
    const plan = plans[config.planIndex];
    
    // Create User
    const user = await prisma.user.create({
      data: {
        name: config.name,
        email: config.email,
        role: "MEMBER",
        tenantId: tenant.id,
      }
    });

    // Create Profile
    const profile = await prisma.memberProfile.create({
      data: {
        userId: user.id,
      }
    });

    // Create Subscription
    let startDate, endDate;
    if (config.status === "ACTIVE") {
      startDate = subtractDays(30 - config.daysLeft!);
      endDate = addDays(config.daysLeft!);
    } else if (config.status === "EXPIRED") {
      startDate = subtractDays(30 + config.daysExpired!);
      endDate = subtractDays(config.daysExpired!);
    } else {
      startDate = subtractDays(60);
      endDate = subtractDays(30);
    }

    await prisma.subscription.create({
      data: {
        memberId: profile.id,
        tenantId: tenant.id,
        planId: plan.id,
        status: config.status as any,
        startDate,
        endDate,
      }
    });

    // Create Attendances (Heatmap data)
    if (config.status !== "SUSPENDED") {
      const attendanceCount = config.status === "ACTIVE" ? Math.floor(Math.random() * 10) + 5 : Math.floor(Math.random() * 3);
      for (let i = 0; i < attendanceCount; i++) {
        await prisma.attendance.create({
          data: {
            memberId: profile.id,
            tenantId: tenant.id,
            checkInTime: subtractDays(i * 3 + 1), // Spread out the check-ins
            method: "MANUAL",
            type: "GENERAL",
          }
        });
      }
    }
  }
  
  console.log(`Seeded 15 Members successfully.`);
  console.log(`Demo Sandbox setup complete for /sandbox/eco-fitness-hub`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
