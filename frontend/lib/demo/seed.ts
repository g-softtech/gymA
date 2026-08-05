import { Prisma, PrismaClient } from "@prisma/client";
import { subDays, addDays, subMonths } from "date-fns";
import { prisma as globalPrisma } from "@/lib/prisma";

const DEMO_DOMAIN = "@demo.cortexfit.com";

// --- Helpers ---
function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function clearExistingDemoData(tx: Prisma.TransactionClient) {
  console.log("🧹 Clearing previous demo data...");
  const oldTenant = await tx.tenant.findUnique({ where: { slug: "demo-elite" } });
  
  if (oldTenant) {
    await tx.transaction.deleteMany({ where: { tenantId: oldTenant.id } });
    await tx.attendance.deleteMany({ where: { tenantId: oldTenant.id } });
    await tx.subscription.deleteMany({ where: { tenantId: oldTenant.id } });
    await tx.booking.deleteMany({ where: { tenantId: oldTenant.id } });
    await tx.comment.deleteMany({ where: { post: { tenantId: oldTenant.id } } });
    await tx.post.deleteMany({ where: { tenantId: oldTenant.id } });
    await tx.classSession.deleteMany({ where: { tenantId: oldTenant.id } });
    await tx.membershipPlan.deleteMany({ where: { tenantId: oldTenant.id } });
    await tx.aiLog.deleteMany({ where: { tenantId: oldTenant.id } });
    await tx.mealPlan.deleteMany({ where: { tenantId: oldTenant.id } });
    await tx.workoutPlan.deleteMany({ where: { tenantId: oldTenant.id } });
    await tx.user.deleteMany({ where: { tenantId: oldTenant.id } });
    await tx.tenant.delete({ where: { id: oldTenant.id } });
  }
  
  // Extra safeguard for orphaned users
  const orphans = await tx.user.findMany({
    where: { email: { endsWith: DEMO_DOMAIN } },
    include: { memberProfile: true }
  });

  if (orphans.length > 0) {
    const memberIds = orphans.map(u => u.memberProfile?.id).filter(Boolean) as string[];
    const userIds = orphans.map(u => u.id);
    
    if (memberIds.length > 0) {
      await tx.transaction.deleteMany({ where: { memberId: { in: memberIds } } });
      await tx.subscription.deleteMany({ where: { memberId: { in: memberIds } } });
      await tx.attendance.deleteMany({ where: { memberId: { in: memberIds } } });
      await tx.booking.deleteMany({ where: { memberId: { in: memberIds } } });
      await tx.mealPlan.deleteMany({ where: { memberId: { in: memberIds } } });
      await tx.workoutPlan.deleteMany({ where: { memberId: { in: memberIds } } });
    }
    await tx.aiLog.deleteMany({ where: { userId: { in: userIds } } });
    await tx.user.deleteMany({ where: { id: { in: userIds } } });
  }
  console.log("✅ Cleared old demo data.");
}

async function seedLiveDemoTransaction(tx: Prisma.TransactionClient) {
  console.log("🌱 Starting LIVE DEMO database seed...");
  await clearExistingDemoData(tx);

  // 1. Create Demo Tenant
  const tenant = await tx.tenant.create({
    data: {
      name: "CortexFit Elite Performance Center",
      slug: "demo-elite",
      isDemo: true,
      status: "APPROVED" as any,
      plan: "ENTERPRISE",
      isActive: true,
      settings: {
        create: {
          brandName: "CortexFit Elite",
          tagline: "The Premium Fitness Experience",
          primaryColor: "#4f46e5",
          defaultCurrency: "NGN",
          gymType: "Premium Health Club",
        }
      }
    }
  });

  // 2. Create Owner
  await tx.user.create({
    data: {
      name: "Demo Gym Owner",
      email: `owner${DEMO_DOMAIN}`,
      password: "$2b$10$WTD.pDYyM7p1AYp/cnANoeI6pd4tboTjwvtcFy8823E4Ay0RFiSYS",
      role: "ADMIN",
      tenantId: tenant.id,
      image: "https://ui-avatars.com/api/?name=Demo+Owner&background=4f46e5&color=fff",
    }
  });

  // 3. Create Membership Plans
  const plans = {
    starter: await tx.membershipPlan.create({
      data: { name: "Starter Plan", price: 15000, durationDays: 30, tenantId: tenant.id, features: ["Gym Access"] }
    }),
    professional: await tx.membershipPlan.create({
      data: { name: "Professional Plan", price: 25000, durationDays: 30, tenantId: tenant.id, featured: true, features: ["Gym Access", "Group Classes"] }
    }),
    premium: await tx.membershipPlan.create({
      data: { name: "Premium Plan", price: 50000, durationDays: 30, tenantId: tenant.id, features: ["Gym Access", "Group Classes", "Personal Training"] }
    }),
    corporate: await tx.membershipPlan.create({
      data: { name: "Corporate Plan", price: 150000, durationDays: 365, tenantId: tenant.id, features: ["All Access"] }
    }),
  };

  // 4. Create Trainers
  const trainers = [];
  for (let i = 1; i <= 15; i++) {
    const isDaniel = i === 1;
    const name = isDaniel ? "Daniel Okoro" : `Trainer ${i}`;
    const email = isDaniel ? `daniel.okoro${DEMO_DOMAIN}` : `trainer${i}${DEMO_DOMAIN}`;
    const user = await tx.user.create({
      data: {
        name, email, password: "$2b$10$WTD.pDYyM7p1AYp/cnANoeI6pd4tboTjwvtcFy8823E4Ay0RFiSYS", role: "TRAINER",
        tenantId: tenant.id,
        image: `https://ui-avatars.com/api/?name=${name.replace(' ', '+')}&background=10b981&color=fff`,
        trainerProfile: {
          create: {
            specialties: isDaniel ? ["Strength Training", "Powerlifting"] : ["General Fitness", "Cardio"],
            bio: isDaniel ? "Elite strength coach with 10 years experience." : "Certified fitness professional.",
            hourlyRate: isDaniel ? 15000 : 8000,
            showOnWebsite: true,
            yearsOfExperience: isDaniel ? 10 : 3,
            availability: {
              monday: ["08:00", "09:00", "10:00", "16:00", "17:00"],
              wednesday: ["08:00", "09:00", "10:00", "16:00", "17:00"],
              friday: ["08:00", "09:00", "10:00"]
            },
          }
        }
      },
      include: { trainerProfile: true }
    });
    trainers.push(user);
  }
  const danielOkoro = trainers[0];

  // 5. Create Members (Smaller subset for faster seeding)
  const now = new Date();
  const members = [];
  
  for (let i = 1; i <= 50; i++) { // Reduced to 50 for faster automated resets
    const joinDate = subDays(now, randomInt(5, 60));
    const plan = plans.professional;

    const user = await tx.user.create({
      data: {
        name: `Demo Member ${i}`, email: `member${i}${DEMO_DOMAIN}`, password: "$2b$10$WTD.pDYyM7p1AYp/cnANoeI6pd4tboTjwvtcFy8823E4Ay0RFiSYS", role: "MEMBER",
        tenantId: tenant.id,
        image: `https://ui-avatars.com/api/?name=Member+${i}&background=f43f5e&color=fff`,
        memberProfile: { create: { fitnessGoals: ["Weight Loss", "Muscle Gain"] } }
      },
      include: { memberProfile: true }
    });
    members.push(user);

    await tx.subscription.create({
      data: {
        memberId: user.memberProfile!.id, planId: plan.id, tenantId: tenant.id,
        startDate: joinDate, endDate: addDays(now, 20), status: "ACTIVE", paymentGatewayId: `paystack_mock_${i}_${Date.now()}`
      }
    });
    
    await tx.transaction.create({
      data: {
        tenantId: tenant.id, memberId: user.memberProfile!.id, itemName: plan.name, itemType: "MEMBERSHIP" as any,
        amount: plan.price, currency: "NGN", status: "SUCCESS" as any, reference: `TRX_${i}_${Date.now()}`, createdAt: joinDate,
      }
    });
  }

  // 6. Community Activity
  const post = await tx.post.create({
    data: { tenantId: tenant.id, authorId: danielOkoro.id, content: "Great effort in class today!" }
  });
  
  await tx.comment.create({
    data: { postId: post.id, authorId: members[0].id, content: "Totally worth it!" }
  });

  return tenant;
}

async function verifyDemoHealth(tx: Prisma.TransactionClient, tenantId: string) {
  const tenant = await tx.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant || !tenant.isDemo) throw new Error("Health Check Failed: Demo tenant missing.");

  const owners = await tx.user.findMany({ where: { tenantId, role: "ADMIN" } });
  if (owners.length !== 1) throw new Error(`Health Check Failed: Expected 1 owner, found ${owners.length}`);

  const members = await tx.user.findMany({ where: { tenantId, role: "MEMBER" } });
  if (members.length === 0) throw new Error("Health Check Failed: No members created.");

  const orphans = await tx.user.findMany({ where: { email: { endsWith: DEMO_DOMAIN }, tenantId: null } });
  if (orphans.length > 0) throw new Error("Health Check Failed: Orphaned demo users detected.");

  console.log("🏥 Health Verification Passed!");
}

/**
 * Public execution entry point.
 * Wraps the seed and health verification in a robust transaction.
 */
export async function resetDemoEnvironmentService() {
  return await globalPrisma.$transaction(async (tx) => {
    const tenant = await seedLiveDemoTransaction(tx);
    await verifyDemoHealth(tx, tenant.id);
    return tenant;
  }, {
    maxWait: 10000, 
    timeout: 30000 
  });
}
