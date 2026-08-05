import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { subDays, addDays, startOfMonth, subMonths } from "date-fns";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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

async function clearExistingDemoData() {
  console.log("🧹 Clearing previous demo data...");
  const oldTenant = await prisma.tenant.findUnique({ where: { slug: "demo-elite" } });
  
  if (oldTenant) {
    // Delete dependent records that don't cascade automatically
    await prisma.transaction.deleteMany({ where: { tenantId: oldTenant.id } });
    await prisma.attendance.deleteMany({ where: { tenantId: oldTenant.id } });
    await prisma.subscription.deleteMany({ where: { tenantId: oldTenant.id } });
    await prisma.booking.deleteMany({ where: { tenantId: oldTenant.id } });
    await prisma.comment.deleteMany({ where: { post: { tenantId: oldTenant.id } } });
    await prisma.post.deleteMany({ where: { tenantId: oldTenant.id } });
    await prisma.classSession.deleteMany({ where: { tenantId: oldTenant.id } });
    await prisma.membershipPlan.deleteMany({ where: { tenantId: oldTenant.id } });

    // Clear demo users
    await prisma.user.deleteMany({
      where: { tenantId: oldTenant.id }
    });
    
    // Clear Demo Tenant
    await prisma.tenant.delete({
      where: { id: oldTenant.id }
    });
  }
  
  // Extra safeguard for orphaned users
  await prisma.user.deleteMany({
    where: { email: { endsWith: DEMO_DOMAIN } }
  });
  console.log("✅ Cleared old demo data.");
}

async function main() {
  console.log("🌱 Starting LIVE DEMO database seed...");
  await clearExistingDemoData();

  // 1. Create Demo Tenant
  console.log("🏢 Creating CortexFit Elite Performance Center...");
  const tenant = await prisma.tenant.create({
    data: {
      name: "CortexFit Elite Performance Center",
      slug: "demo-elite",
      isDemo: true,
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
  console.log("👑 Creating Gym Owner...");
  await prisma.user.create({
    data: {
      name: "Demo Gym Owner",
      email: `owner${DEMO_DOMAIN}`,
      password: "$2b$10$WTD.pDYyM7p1AYp/cnANoeI6pd4tboTjwvtcFy8823E4Ay0RFiSYS", // hashed "password"
      role: "ADMIN",
      tenantId: tenant.id,
      image: "https://ui-avatars.com/api/?name=Demo+Owner&background=4f46e5&color=fff",
    }
  });

  // 3. Create Membership Plans
  console.log("💳 Creating Membership Plans...");
  const plans = {
    starter: await prisma.membershipPlan.create({
      data: { name: "Starter Plan", price: 15000, durationDays: 30, tenantId: tenant.id, features: ["Gym Access"] }
    }),
    professional: await prisma.membershipPlan.create({
      data: { name: "Professional Plan", price: 25000, durationDays: 30, tenantId: tenant.id, featured: true, features: ["Gym Access", "Group Classes"] }
    }),
    premium: await prisma.membershipPlan.create({
      data: { name: "Premium Plan", price: 50000, durationDays: 30, tenantId: tenant.id, features: ["Gym Access", "Group Classes", "Personal Training"] }
    }),
    corporate: await prisma.membershipPlan.create({
      data: { name: "Corporate Plan", price: 150000, durationDays: 365, tenantId: tenant.id, features: ["All Access"] }
    }),
  };

  // 4. Create Trainers
  console.log("🏋️‍♂️ Creating Trainers...");
  const trainers = [];
  for (let i = 1; i <= 15; i++) {
    const isDaniel = i === 1;
    const name = isDaniel ? "Daniel Okoro" : `Trainer ${i}`;
    const email = isDaniel ? `daniel.okoro${DEMO_DOMAIN}` : `trainer${i}${DEMO_DOMAIN}`;
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: "$2b$10$WTD.pDYyM7p1AYp/cnANoeI6pd4tboTjwvtcFy8823E4Ay0RFiSYS",
        role: "TRAINER",
        tenantId: tenant.id,
        image: `https://ui-avatars.com/api/?name=${name.replace(' ', '+')}&background=10b981&color=fff`,
        trainerProfile: {
          create: {
            specialties: isDaniel ? ["Strength Training", "Powerlifting"] : ["General Fitness", "Cardio"],
            availability: {},
            bio: isDaniel ? "Elite strength coach with 10 years experience." : "Certified fitness professional.",
            hourlyRate: isDaniel ? 15000 : 8000,
            showOnWebsite: true,
            yearsOfExperience: isDaniel ? 10 : 3,
          }
        }
      },
      include: { trainerProfile: true }
    });
    trainers.push(user);
  }
  const danielOkoro = trainers[0];

  // 5. Create Members (Growth Story over 12 months)
  console.log("👥 Creating 250 Members (12-month growth)...");
  
  const now = new Date();
  const members = [];
  
  // Scenarios targets:
  let membersToCreate = 250;
  let expiringThisWeekTarget = 15;
  let churnRiskTarget = 10;
  
  // Distributed creation
  for (let i = 1; i <= membersToCreate; i++) {
    // Determine join date (weighted towards recent months for growth curve)
    // Use an inverse curve to skew dates closer to now
    const monthOffset = Math.floor(12 * (1 - Math.pow(Math.random(), 2))); 
    const joinDate = subDays(subMonths(now, monthOffset), randomInt(1, 28));
    
    // Choose Plan (Distribution: 70 Starter, 120 Pro, 45 Premium, 15 Corp)
    let plan = plans.professional;
    if (i <= 70) plan = plans.starter;
    else if (i <= 190) plan = plans.professional;
    else if (i <= 235) plan = plans.premium;
    else plan = plans.corporate;

    const email = `member${i}${DEMO_DOMAIN}`;
    const memberName = `Demo Member ${i}`;
    
    const user = await prisma.user.create({
      data: {
        name: memberName,
        email: email,
        password: "$2b$10$WTD.pDYyM7p1AYp/cnANoeI6pd4tboTjwvtcFy8823E4Ay0RFiSYS",
        role: "MEMBER",
        tenantId: tenant.id,
        image: `https://ui-avatars.com/api/?name=Member+${i}&background=f43f5e&color=fff`,
        memberProfile: {
          create: {
            fitnessGoals: ["Weight Loss", "Muscle Gain"],
          }
        }
      },
      include: { memberProfile: true }
    });
    
    members.push(user);

    // Subscriptions logic
    let subStatus: "ACTIVE" | "EXPIRED" | "CANCELLED" = "ACTIVE";
    let endDate = addDays(joinDate, plan.durationDays);
    
    const memberTransactions = [];

    // Fast forward subscription cycles to present
    while (endDate < subDays(now, 14)) {
      if (Math.random() > 0.95) { subStatus = "CANCELLED"; break; } // 5% churn
      
      // Add transaction for past renewal
      memberTransactions.push({
           tenantId: tenant.id,
           memberId: user.memberProfile!.id,
           itemName: plan.name,
           itemType: "MEMBERSHIP",
           amount: plan.price,
           currency: "NGN",
           status: "SUCCESS",
           reference: `TRX_PAST_${i}_${endDate.getTime()}`,
           createdAt: joinDate,
      });
      endDate = addDays(endDate, plan.durationDays);
    }
    
    // Apply specific scenarios
    if (subStatus === "ACTIVE") {
      if (expiringThisWeekTarget > 0) {
        // Force expiration within next 7 days
        endDate = addDays(now, randomInt(1, 6));
        expiringThisWeekTarget--;
      } else {
        // Normal active user, end date in future
        endDate = addDays(now, randomInt(10, 30));
      }
    }
    
    // Create current subscription
    await prisma.subscription.create({
      data: {
        memberId: user.memberProfile!.id,
        planId: plan.id,
        tenantId: tenant.id,
        startDate: subDays(endDate, plan.durationDays),
        endDate: endDate,
        status: subStatus,
        paymentGatewayId: `paystack_mock_${i}_${Date.now()}`
      }
    });
    
    // Add transaction for current active subscription
    if (subStatus === "ACTIVE") {
      memberTransactions.push({
           tenantId: tenant.id,
           memberId: user.memberProfile!.id,
           itemName: plan.name,
           itemType: "MEMBERSHIP",
           amount: plan.price,
           currency: "NGN",
           status: "SUCCESS",
           reference: `TRX_CURR_${i}_${Date.now()}`,
           createdAt: subDays(endDate, plan.durationDays),
      });
    }

    if (memberTransactions.length > 0) {
      await prisma.transaction.createMany({ data: memberTransactions });
    }

    // Attendance Logic
    const isChurnRisk = churnRiskTarget > 0 && subStatus === "ACTIVE";
    if (isChurnRisk) churnRiskTarget--;
    
    const lastPossibleAttendance = isChurnRisk ? subDays(now, 46) : now;
    const numAttendances = randomInt(5, 30);
    
    const attendances = [];
    for (let a = 0; a < numAttendances; a++) {
      const attDate = randomDate(joinDate, lastPossibleAttendance);
      attendances.push({
        memberId: user.memberProfile!.id,
        tenantId: tenant.id,
        method: "QR",
        status: "PRESENT",
        type: "GENERAL" as any,
        checkInTime: attDate,
      });
    }
    
    if (attendances.length > 0) {
      await prisma.attendance.createMany({ data: attendances });
    }
    
    // Slight delay to prevent connection pool exhaustion during massive seeding
    await new Promise((resolve) => setTimeout(resolve, 20));
  }

  // 6. Create Classes & Bookings (Scenario: Popular Class)
  console.log("📅 Creating Classes & Bookings...");
  const strengthClass = await prisma.classSession.create({
    data: {
      title: "Strength Training",
      tenantId: tenant.id,
      instructorId: danielOkoro.trainerProfile!.id,
      startTime: addDays(now, 1),
      capacity: 30,
      durationMins: 60,
    }
  });

  // Add 28 bookings to make it a 93% filled "Popular Class"
  const classBookings = [];
  for (let b = 0; b < 28; b++) {
    classBookings.push({
      classSessionId: strengthClass.id,
      memberId: members[b].memberProfile!.id,
      tenantId: tenant.id,
      date: addDays(now, 1),
      status: "CONFIRMED" as any,
      sessionType: "PHYSICAL" as any
    });
  }
  if (classBookings.length > 0) await prisma.booking.createMany({ data: classBookings });

  // Add Daniel Okoro's PT sessions (Scenario: High Performer - 120 completed)
  const ptBookings = [];
  for (let pt = 0; pt < 120; pt++) {
    const ptDate = subDays(now, randomInt(1, 90));
    ptBookings.push({
      trainerId: danielOkoro.trainerProfile!.id,
      memberId: randomItem(members).memberProfile!.id,
      tenantId: tenant.id,
      date: ptDate,
      status: "COMPLETED" as any,
      sessionType: "PHYSICAL" as any
    });
  }
  if (ptBookings.length > 0) await prisma.booking.createMany({ data: ptBookings });

  // 7. Community Activity
  console.log("💬 Creating Community Content...");
  const post = await prisma.post.create({
    data: {
      tenantId: tenant.id,
      authorId: danielOkoro.id,
      content: "Great effort by everyone in today's strength class! Keep pushing!",
    }
  });
  
  await prisma.comment.create({
    data: {
      postId: post.id,
      authorId: members[0].id,
      content: "My legs are dead but totally worth it!",
    }
  });

  console.log("✅ LIVE DEMO SEED COMPLETE!");
}

main()
  .catch((e) => {
    console.error("❌ Demo Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
