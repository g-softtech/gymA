import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log("🌱 Seeding Marketing Showcase Data...");

  const uid = Math.random().toString(36).substring(2, 6);
  const passwordHash = await bcrypt.hash("Showcase2026!", 10);

  // 1. Create Tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: "Apex Performance Club",
      slug: `apex-performance-${uid}`,
      plan: "ENTERPRISE",
      status: "APPROVED",
      billingStatus: "ACTIVE",
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      settings: {
        create: {
          brandName: "Apex Performance",
          primaryColor: "#0EA5E9",
          secondaryColor: "#0284C7",
          fontFamily: "Inter",
          darkMode: true,
        }
      }
    }
  });

  console.log(`✅ Created Gym: ${tenant.name}`);

  // 2. Create Admin
  const adminEmail = `admin-${uid}@apexperformance.com`;
  const admin = await prisma.user.create({
    data: {
      name: "Sarah Jenkins (Owner)",
      email: adminEmail,
      password: passwordHash,
      role: "ADMIN",
      tenantId: tenant.id,
      emailVerified: new Date(),
    }
  });
  console.log(`✅ Created Admin: ${admin.email}`);

  // 3. Create Plans
  const elitePlan = await prisma.membershipPlan.create({
    data: {
      tenantId: tenant.id,
      name: "Apex Elite Unlimited",
      price: 25000,
      currency: "NGN",
      durationDays: 30,
      isActive: true,
    }
  });

  const standardPlan = await prisma.membershipPlan.create({
    data: {
      tenantId: tenant.id,
      name: "Apex Standard Access",
      price: 15000,
      currency: "NGN",
      durationDays: 30,
      isActive: true,
    }
  });

  // 4. Create 15 Members with realistic states
  const membersData = [
    // Active (Healthy)
    { name: "Marcus Johnson", status: "ACTIVE", daysOffset: 15, plan: elitePlan.id },
    { name: "Elena Rodriguez", status: "ACTIVE", daysOffset: 20, plan: standardPlan.id },
    { name: "David Chen", status: "ACTIVE", daysOffset: 10, plan: elitePlan.id },
    { name: "Sarah Williams", status: "ACTIVE", daysOffset: 25, plan: standardPlan.id },
    { name: "James Carter", status: "ACTIVE", daysOffset: 5, plan: elitePlan.id },
    
    // Expired (Recent Churn)
    { name: "Michael Chang", status: "EXPIRED", daysOffset: -2, plan: standardPlan.id },
    { name: "Jessica Smith", status: "EXPIRED", daysOffset: -5, plan: elitePlan.id },
    { name: "Robert Miller", status: "EXPIRED", daysOffset: -10, plan: standardPlan.id },
    { name: "Amanda Davis", status: "EXPIRED", daysOffset: -1, plan: elitePlan.id },
    { name: "Tom Wilson", status: "EXPIRED", daysOffset: -7, plan: standardPlan.id },
    
    // Suspended
    { name: "Chris Anderson", status: "SUSPENDED", daysOffset: 10, plan: elitePlan.id },
    { name: "Lisa Taylor", status: "SUSPENDED", daysOffset: 5, plan: standardPlan.id },
    { name: "Kevin Brown", status: "SUSPENDED", daysOffset: 12, plan: elitePlan.id },
    
    // Pending Payment
    { name: "Rachel Moore", status: "PENDING_PAYMENT", daysOffset: 30, plan: standardPlan.id },
    { name: "Daniel White", status: "PENDING_PAYMENT", daysOffset: 30, plan: elitePlan.id },
  ];

  const createdMembers = [];

  for (const m of membersData) {
    const email = `${m.name.toLowerCase().replace(' ', '.')}.-${uid}@example.com`;
    
    const user = await prisma.user.create({
      data: {
        name: m.name,
        email: email,
        password: passwordHash,
        role: "MEMBER",
        tenantId: tenant.id,
        emailVerified: new Date(),
        memberProfile: {
          create: {
            fitnessGoals: ["Strength Training", "Cardio"],
          }
        }
      },
      include: { memberProfile: true }
    });

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(now.getDate() + m.daysOffset);
    
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 30);

    const sub = await prisma.subscription.create({
      data: {
        memberId: user.memberProfile!.id,
        planId: m.plan,
        tenantId: tenant.id,
        startDate,
        endDate,
        status: m.status as any,
      }
    });

    createdMembers.push({ email, name: m.name, status: m.status });
  }

  console.log(`✅ Created 15 Diverse Members`);

  // 5. Generate Fake Intelligence AI Telemetry
  // Create an Ops Metric Rollup to make the dashboard look active
  await prisma.intelligenceOpsMetrics.create({
    data: {
      tenantId: tenant.id,
      generatedCount: 142,
      approvedCount: 89,
      executedCount: 85,
      successfulCount: 41,
      partialSuccessCount: 12,
      failureCount: 32,
      retainedMRR: 850000,
      averageConfidence: 0.82,
      averageExecutionTime: 1200,
      averageEvaluationDelay: 86400000,
      algorithmVersion: 2,
      explorationVersion: 1,
      explorationPolicy: "BAYESIAN",
      rollupKey: `showcase-metrics-${tenant.id}`,
    }
  });

  // Create an Active Experiment for the A/B testing dashboard
  await prisma.intelligenceExperiment.create({
    data: {
      name: "Q3 Churn Prevention Model Test",
      type: "CHURN_RISK_MODEL",
      layer: "POLICY",
      isActive: true,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Started 30 days ago
      trafficSplit: { CONTROL: 0.5, BAYESIAN: 0.5 },
    }
  });

  console.log(`✅ Injected Intelligence AI Telemetry Data`);

  console.log("\n🚀 SHOWCASE ENVIRONMENT READY 🚀");
  console.log("=============================================");
  console.log("🏢 GYM NAME: Apex Performance Club");
  console.log(`🌐 URL: /gym/apex-performance-${uid}/dashboard`);
  console.log("=============================================");
  console.log("👑 ADMIN LOGIN:");
  console.log(`Email: ${adminEmail}`);
  console.log("Password: Showcase2026!");
  console.log("=============================================");
  console.log("👥 MEMBER LOGINS (Password is 'Showcase2026!' for all):");
  createdMembers.forEach(m => {
    console.log(`- ${m.name} | ${m.email} | [${m.status}]`);
  });
  console.log("=============================================");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
