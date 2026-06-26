import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting demo database seed...");

  // --- 1. SET UP TENANT (GYM) ---
  const tenant = await prisma.tenant.upsert({
    where: { slug: "cortexfit" },
    update: { name: "CortexFit Gym" },
    create: {
      name: "CortexFit Gym",
      slug: "cortexfit",
    },
  });
  console.log(`✅ Seeded Tenant: ${tenant.name}`);

  // --- 2. SET UP MEMBERSHIP PLANS ---
  const [basicPlan, premiumPlan] = await Promise.all([
    prisma.membershipPlan.upsert({
      where: { id: "plan_basic_001" },
      update: {},
      create: {
        id: "plan_basic_001",
        name: "Basic Monthly",
        price: 29.99,
        durationDays: 30,
        tenantId: tenant.id,
      },
    }),
    prisma.membershipPlan.upsert({
      where: { id: "plan_premium_001" },
      update: {},
      create: {
        id: "plan_premium_001",
        name: "Premium Monthly",
        price: 49.99,
        durationDays: 30,
        tenantId: tenant.id,
      },
    })
  ]);
  console.log("✅ Seeded Membership Plans");

  // --- 3. CLEAR PREVIOUS DEMO USERS (For easy reset) ---
  // Note: We use a specific email pattern to only delete demo users.
  await prisma.user.deleteMany({
    where: {
      email: { endsWith: "@demo.cortexfit.com" }
    }
  });
  console.log("🧹 Cleared previous demo users");

  // --- 4. HELPER DATES ---
  const now = new Date();
  
  // Past dates (for expired subscriptions)
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(now.getDate() - 60);

  // Future dates (for active subscriptions)
  const thirtyDaysFromNow = new Date(now);
  thirtyDaysFromNow.setDate(now.getDate() + 30);

  // --- 5. CREATE DEMO USERS ---

  // ------------------------------------------------------------------
  // CATEGORY 1: EXPIRED USERS (5 Users)
  // ------------------------------------------------------------------
  console.log("⏳ Seeding Expired Users...");
  
  // USER A (MAIN DEMO USER) - EXPIRED
  const userA = await prisma.user.create({
    data: {
      name: "Alex Mercer (Main Demo)",
      email: "alex.expired@demo.cortexfit.com",
      password: "$2b$10$WTD.pDYyM7p1AYp/cnANoeI6pd4tboTjwvtcFy8823E4Ay0RFiSYS",
      role: "MEMBER",
      tenantId: tenant.id,
      memberProfile: {
        create: {
          subscriptions: {
            create: {
              planId: basicPlan.id,
              tenantId: tenant.id,
              startDate: sixtyDaysAgo,
              endDate: thirtyDaysAgo, // Expired 30 days ago
              status: "EXPIRED",
              paymentGatewayId: "paystack_ref_old_001",
            }
          }
        }
      }
    }
  });

  // 4 More Expired Users
  const expiredNames = ["Sarah Connor", "John Wick", "Ellen Ripley", "James Bond"];
  for (let i = 0; i < 4; i++) {
    await prisma.user.create({
      data: {
        name: `Expired User ${i + 1}`,
        email: `expired${i + 1}@demo.cortexfit.com`,
        password: "$2b$10$WTD.pDYyM7p1AYp/cnANoeI6pd4tboTjwvtcFy8823E4Ay0RFiSYS",
        role: "MEMBER",
        tenantId: tenant.id,
        memberProfile: {
          create: {
            subscriptions: {
              create: {
                planId: basicPlan.id,
                tenantId: tenant.id,
                startDate: sixtyDaysAgo,
                endDate: thirtyDaysAgo,
                status: "EXPIRED",
                paymentGatewayId: `paystack_ref_old_b${i}`,
              }
            }
          }
        }
      }
    });
  }

  // ------------------------------------------------------------------
  // CATEGORY 2: ACTIVE USERS (5 Users)
  // ------------------------------------------------------------------
  console.log("🟢 Seeding Active Users...");

  // USER B - ACTIVE
  const userB = await prisma.user.create({
    data: {
      name: "Bruce Wayne (Active)",
      email: "bruce.active@demo.cortexfit.com",
      password: "$2b$10$WTD.pDYyM7p1AYp/cnANoeI6pd4tboTjwvtcFy8823E4Ay0RFiSYS",
      role: "MEMBER",
      tenantId: tenant.id,
      memberProfile: {
        create: {
          subscriptions: {
            create: {
              planId: premiumPlan.id,
              tenantId: tenant.id,
              startDate: now,
              endDate: thirtyDaysFromNow, // Active for next 30 days
              status: "ACTIVE",
              paymentGatewayId: "paystack_ref_active_001",
            }
          }
        }
      }
    }
  });

  // 4 More Active Users
  const activeNames = ["Diana Prince", "Clark Kent", "Barry Allen", "Arthur Curry"];
  for (let i = 0; i < 4; i++) {
    await prisma.user.create({
      data: {
        name: `Active User ${i + 1}`,
        email: `active${i + 1}@demo.cortexfit.com`,
        password: "$2b$10$WTD.pDYyM7p1AYp/cnANoeI6pd4tboTjwvtcFy8823E4Ay0RFiSYS",
        role: "MEMBER",
        tenantId: tenant.id,
        memberProfile: {
          create: {
            subscriptions: {
              create: {
                planId: premiumPlan.id,
                tenantId: tenant.id,
                startDate: now,
                endDate: thirtyDaysFromNow,
                status: "ACTIVE",
                paymentGatewayId: `paystack_ref_active_b${i}`,
              }
            }
          }
        }
      }
    });
  }

  // ------------------------------------------------------------------
  // CATEGORY 3: NO SUBSCRIPTION USERS (5 Users)
  // ------------------------------------------------------------------
  console.log("⚪ Seeding No-Subscription Users...");

  // USER C - NO SUBSCRIPTION
  const userC = await prisma.user.create({
    data: {
      name: "Peter Parker (No Sub)",
      email: "peter.nosub@demo.cortexfit.com",
      password: "$2b$10$WTD.pDYyM7p1AYp/cnANoeI6pd4tboTjwvtcFy8823E4Ay0RFiSYS",
      role: "MEMBER",
      tenantId: tenant.id,
      memberProfile: {
        create: {} // No subscriptions added
      }
    }
  });

  // 4 More No-Subscription Users
  const noSubNames = ["Tony Stark", "Steve Rogers", "Natasha Romanoff", "Bruce Banner"];
  for (let i = 0; i < 4; i++) {
    await prisma.user.create({
      data: {
        name: `No Sub User ${i + 1}`,
        email: `nosub${i + 1}@demo.cortexfit.com`,
        password: "$2b$10$WTD.pDYyM7p1AYp/cnANoeI6pd4tboTjwvtcFy8823E4Ay0RFiSYS",
        role: "MEMBER",
        tenantId: tenant.id,
        memberProfile: {
          create: {} // No subscriptions added
        }
      }
    });
  }

  console.log("✅ Seed complete! Demo users created.");
  
  // ------------------------------------------------------------------
  // 🎬 DEMO TRANSITION SIMULATION: PAYSTACK RENEWAL
  // ------------------------------------------------------------------
  /* 
    INSTRUCTIONS FOR DEMO VIDEO:
    To show the transition from "Expired" to "Active" via Paystack:
    1. Show User A ("Alex Mercer") in the UI - they will be Expired.
    2. During the demo, uncomment the block below and run the seed script again,
       OR run a separate script that executes this block.
    3. This simulates a successful Paystack webhook inserting a new subscription.
    4. Refresh the UI to show User A is now Active!
  */
  
  /*
  console.log("🚀 SIMULATING PAYSTACK WEBHOOK FOR USER A...");
  
  // Fetch User A's MemberProfile ID
  const demoProfile = await prisma.memberProfile.findUnique({
    where: { userId: userA.id }
  });

  if (demoProfile) {
    await prisma.subscription.create({
      data: {
        memberId: demoProfile.id,
        planId: basicPlan.id,
        tenantId: tenant.id,
        startDate: now,
        endDate: thirtyDaysFromNow, // New active period
        status: "ACTIVE",
        paymentGatewayId: "paystack_ref_NEW_PAYMENT_999", // Different reference
      }
    });
    console.log("✅ Successfully added new ACTIVE subscription for User A!");
  }
  */
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
