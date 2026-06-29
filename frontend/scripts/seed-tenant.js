const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with a new tenant, 4 plans, and 15 members...");

  // 1. Create a common password for all seeded users
  const passwordText = "TitanFit2026!";
  const hashedPassword = await bcrypt.hash(passwordText, 10);

  // 2. Create the Tenant
  const tenantName = "Titan Fitness Studio";
  const slug = "titan-fitness";

  // Check if it already exists, if so delete it so we can start fresh
  const existingTenant = await prisma.tenant.findUnique({ where: { slug } });
  if (existingTenant) {
    console.log(`Tenant '${slug}' already exists. Deleting to start fresh...`);
    await prisma.tenant.delete({ where: { slug } });
  }

  const tenant = await prisma.tenant.create({
    data: {
      name: tenantName,
      slug: slug,
      plan: "ENTERPRISE",
      isActive: true,
      status: "APPROVED",
      settings: {
        create: {
          brandName: tenantName,
          primaryColor: "#ef4444", // Red branding
          darkMode: false,
          subscriptionPlan: "ENTERPRISE",
          subscriptionStatus: "active"
        }
      }
    }
  });

  console.log(`✅ Created Tenant: ${tenant.name} (Slug: ${tenant.slug})`);

  // 3. Create 4 Subscription Plans
  const plansData = [
    { name: "Basic Pass", price: 10000, durationDays: 30, featured: false, currency: "NGN", tenantId: tenant.id },
    { name: "Standard Gym", price: 25000, durationDays: 30, featured: true, currency: "NGN", tenantId: tenant.id },
    { name: "Premium Plus", price: 65000, durationDays: 90, featured: false, currency: "NGN", tenantId: tenant.id },
    { name: "VIP Elite", price: 120000, durationDays: 180, featured: false, currency: "NGN", tenantId: tenant.id }
  ];

  const plans = [];
  for (const p of plansData) {
    const createdPlan = await prisma.membershipPlan.create({ data: p });
    plans.push(createdPlan);
  }
  console.log(`✅ Created ${plans.length} Subscription Plans`);

  // 4. Generate 15 Real-Name Members
  const memberNames = [
    "Marcus Johnson", "Sarah Connor", "David Miller", "Emily Chen", "Michael Scott", // Active
    "Jessica Williams", "Daniel Taylor", "Sophia Davis", "James Wilson", "Olivia Moore", // Expired
    "William Anderson", "Isabella Thomas", "Ethan Martinez", "Mia Garcia", "Alexander White" // No Subscription
  ];

  console.log("\n--- Creating Members ---");
  const users = [];

  for (let i = 0; i < memberNames.length; i++) {
    const fullName = memberNames[i];
    const email = `${fullName.toLowerCase().replace(" ", ".")}@example.com`;

    const user = await prisma.user.create({
      data: {
        name: fullName,
        email: email,
        password: hashedPassword,
        role: "MEMBER",
        tenantId: tenant.id,
        memberProfile: {
          create: {
            fitnessGoals: ["Weight Loss", "Muscle Gain"]
          }
        }
      },
      include: {
        memberProfile: true
      }
    });
    users.push(user);
  }
  console.log(`✅ Created ${users.length} Member Accounts`);

  // 5. Assign Subscriptions
  // Active: First 5
  for (let i = 0; i < 5; i++) {
    const user = users[i];
    const plan = plans[i % plans.length];
    
    await prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        memberId: user.memberProfile.id,
        planId: plan.id,
        status: "ACTIVE",
        startDate: new Date(),
        endDate: new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000)
      }
    });
  }

  // Expired: Next 5
  for (let i = 5; i < 10; i++) {
    const user = users[i];
    const plan = plans[i % plans.length];
    
    const pastStart = new Date(Date.now() - (plan.durationDays * 2 * 24 * 60 * 60 * 1000));
    const pastEnd = new Date(Date.now() - (10 * 24 * 60 * 60 * 1000)); // expired 10 days ago

    await prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        memberId: user.memberProfile.id,
        planId: plan.id,
        status: "EXPIRED",
        startDate: pastStart,
        endDate: pastEnd
      }
    });
  }

  console.log(`✅ Assigned 5 Active and 5 Expired Subscriptions`);

  // 6. Output the credentials
  console.log("\n=======================================================");
  console.log("🎉 SEEDING COMPLETE! 🎉");
  console.log("=======================================================");
  console.log(`Tenant Slug     : ${tenant.slug}`);
  console.log(`Common Password : ${passwordText}`);
  console.log("-------------------------------------------------------");
  console.log("ACTIVE MEMBERS:");
  for (let i = 0; i < 5; i++) {
    console.log(`  - ${users[i].name} (${users[i].email})`);
  }
  console.log("\nEXPIRED MEMBERS:");
  for (let i = 5; i < 10; i++) {
    console.log(`  - ${users[i].name} (${users[i].email})`);
  }
  console.log("\nNO SUBSCRIPTION MEMBERS:");
  for (let i = 10; i < 15; i++) {
    console.log(`  - ${users[i].name} (${users[i].email})`);
  }
  console.log("=======================================================\n");

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
