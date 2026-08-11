import { config } from "dotenv";
config({ path: ".env" });

async function fixDemoMembers() {
  const { prisma } = await import("../lib/prisma");
  console.log("Fixing demo members...");

  const tenant = await prisma.tenant.findUnique({
    where: { slug: "demo-elite" },
  });

  if (!tenant) {
    console.log("Demo tenant not found!");
    process.exit(1);
  }

  const plans = await prisma.membershipPlan.findMany({
    where: { tenantId: tenant.id },
  });

  if (plans.length === 0) {
    console.log("No plans found for demo tenant!");
    process.exit(1);
  }

  const subscriptions = await prisma.subscription.findMany({
    where: { tenantId: tenant.id },
  });

  console.log(`Found ${subscriptions.length} subscriptions. Randomizing plans...`);

  for (const sub of subscriptions) {
    const randomPlan = plans[Math.floor(Math.random() * plans.length)];
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { planId: randomPlan.id },
    });
  }

  console.log("Member plan randomization complete!");
  await prisma.$disconnect();
}

fixDemoMembers().catch(console.error);
