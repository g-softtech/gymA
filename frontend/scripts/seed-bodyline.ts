import "dotenv/config";
import { TenantStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("Starting Bodyline Sandbox Seed...");

  const SLUG = "bodyline-fitness-gym";

  // 1. Clean up existing demo data if any
  const existingTenant = await prisma.tenant.findUnique({ where: { slug: SLUG } });
  if (existingTenant) {
    console.log("Cleaning up existing demo tenant...");
    // Since we now know there are many foreign keys, deleting just the tenant might fail without cascade.
    // However, our new cleanup-tenants.ts logic handled cascades.
    // To be safe, we'll try to just delete the tenant, assuming our schema cascade handles it, 
    // or we use the logic from cleanup-tenants if it fails.
    // The previous seed-demo.ts just did `await prisma.tenant.delete({ where: { slug: SLUG } });`.
    try {
      await prisma.tenant.delete({ where: { slug: SLUG } });
    } catch (e) {
      console.log("Failed to cascade delete via prisma, please run cleanup-tenants first if needed.");
    }
  }

  // 2. Create the Demo Tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: "Bodyline Fitness & Gym",
      slug: SLUG,
      isDemo: true,
      isActive: true,
      status: "APPROVED" as TenantStatus,
    },
  });
  console.log(`Created Tenant: ${tenant.name} (${tenant.id})`);

  // 3. Create Plans
  const plansData = [
    { name: "Bodyline Basic", price: 20000, durationDays: 30, description: "Gym Floor Access", tenantId: tenant.id, isActive: true },
    { name: "Bodyline Pro", price: 35000, durationDays: 30, description: "Gym + Classes", tenantId: tenant.id, isActive: true },
    { name: "Bodyline Elite", price: 60000, durationDays: 30, description: "All Access + Recovery Room", tenantId: tenant.id, isActive: true },
    { name: "CrossFit Unlimited", price: 45000, durationDays: 30, description: "Unlimited CrossFit Sessions", tenantId: tenant.id, isActive: true },
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
    // 10 ACTIVE
    { name: "Kunle Afolayan", email: "kunle@bodyline.demo", planIndex: 2, status: "ACTIVE", daysLeft: 18 },
    { name: "Sarah Johnson", email: "sarah@bodyline.demo", planIndex: 1, status: "ACTIVE", daysLeft: 5 },
    { name: "Michael Obi", email: "michael@bodyline.demo", planIndex: 3, status: "ACTIVE", daysLeft: 22 },
    { name: "Grace Ndubuisi", email: "grace@bodyline.demo", planIndex: 0, status: "ACTIVE", daysLeft: 29 },
    { name: "David Peters", email: "david@bodyline.demo", planIndex: 3, status: "ACTIVE", daysLeft: 14 },
    { name: "Blessing Okon", email: "blessing@bodyline.demo", planIndex: 1, status: "ACTIVE", daysLeft: 7 },
    { name: "Samuel Adams", email: "samuel@bodyline.demo", planIndex: 2, status: "ACTIVE", daysLeft: 21 },
    { name: "Joy Alabi", email: "joy@bodyline.demo", planIndex: 0, status: "ACTIVE", daysLeft: 2 },
    { name: "Victor Eze", email: "victor@bodyline.demo", planIndex: 1, status: "ACTIVE", daysLeft: 11 },
    { name: "Anita Chukwu", email: "anita@bodyline.demo", planIndex: 2, status: "ACTIVE", daysLeft: 25 },
    // 3 EXPIRED
    { name: "Tomiwa Salami", email: "tomiwa@bodyline.demo", planIndex: 0, status: "EXPIRED", daysExpired: 8 },
    { name: "Nnamdi Kalu", email: "nnamdi@bodyline.demo", planIndex: 2, status: "EXPIRED", daysExpired: 15 },
    { name: "Helen Bassey", email: "helen@bodyline.demo", planIndex: 1, status: "EXPIRED", daysExpired: 3 },
    // 1 SUSPENDED
    { name: "Chinedu Okafor", email: "chinedu@bodyline.demo", planIndex: 3, status: "SUSPENDED", reason: "Chargeback filed" },
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
      const attendanceCount = config.status === "ACTIVE" ? Math.floor(Math.random() * 12) + 8 : Math.floor(Math.random() * 4);
      for (let i = 0; i < attendanceCount; i++) {
        await prisma.attendance.create({
          data: {
            memberId: profile.id,
            tenantId: tenant.id,
            checkInTime: subtractDays(i * 2 + 1), // More frequent check-ins
            method: "MANUAL",
            type: "GENERAL",
          }
        });
      }
    }
  }
  
  console.log(`Seeded ${membersConfig.length} Members successfully.`);
  console.log(`Demo Sandbox setup complete for /sandbox/${SLUG}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
