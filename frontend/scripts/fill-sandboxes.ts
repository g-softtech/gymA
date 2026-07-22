import "dotenv/config";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Starting sandbox data fulfillment...");

  // Find all sandboxes (isDemo: true)
  const sandboxes = await prisma.tenant.findMany({
    where: { isDemo: true }
  });

  console.log(`Found ${sandboxes.length} sandboxes: ${sandboxes.map(s => s.slug).join(", ")}`);

  const password = await bcrypt.hash("password123", 10);

  for (const tenant of sandboxes) {
    console.log(`\nProcessing sandbox: ${tenant.name}...`);

    // 1. Ensure 4 plans
    const existingPlans = await prisma.membershipPlan.findMany({
      where: { tenantId: tenant.id }
    });

    const requiredPlans = [
      { name: "Basic Plan", price: 5000, features: ["Gym Access"] },
      { name: "Silver Plan", price: 10000, features: ["Gym Access", "Locker"] },
      { name: "Gold Plan", price: 15000, features: ["Gym Access", "Locker", "Group Classes"] },
      { name: "Platinum Plan", price: 25000, features: ["All Access", "Personal Trainer"] },
    ];

    const currentPlans = [...existingPlans];
    
    for (const req of requiredPlans) {
      if (!currentPlans.find(p => p.name === req.name)) {
        const p = await prisma.membershipPlan.create({
          data: {
            tenantId: tenant.id,
            name: req.name,
            description: `The best ${req.name} you can get.`,
            price: req.price,
            durationDays: 30,
            features: req.features,
            isActive: true,
          }
        });
        currentPlans.push(p);
      }
    }
    console.log(`  Plans verified (Total: ${currentPlans.length})`);

    // We will distribute members among plans, default to the first plan
    const defaultPlan = currentPlans[0];

    // 2. Ensure exactly 15 members with specific states (5 Active, 5 Expired, 5 Suspended)
    // We will just create 15 NEW users with explicit emails like member-active-1@... 
    // or we can count existing and fill the gaps.
    // To be perfectly accurate and clean, let's just create them with predictable emails
    // so if the script runs twice, it updates them.

    const memberTypes = [
      { type: "active", status: "ACTIVE", count: 5, startDate: new Date(), endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      { type: "expired", status: "EXPIRED", count: 5, startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      { type: "suspended", status: "SUSPENDED", count: 5, startDate: new Date(), endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    ];

    const tasks = [];

    for (const mt of memberTypes) {
      for (let i = 1; i <= mt.count; i++) {
        tasks.push(async () => {
          const email = `member-${mt.type}-${i}@${tenant.slug}.com`;
          
          // Upsert user
          const user = await prisma.user.upsert({
            where: { email },
            update: {}, 
            create: {
              email,
              name: `${mt.type.charAt(0).toUpperCase() + mt.type.slice(1)} Member ${i}`,
              password,
              role: "MEMBER",
              tenantId: tenant.id,
            }
          });

          // Ensure MemberProfile exists
          let profile = await prisma.memberProfile.findUnique({ where: { userId: user.id } });
          if (!profile) {
            profile = await prisma.memberProfile.create({
              data: { userId: user.id }
            });
          }

          // Delete existing subscriptions for this member to reset state cleanly
          await prisma.subscription.deleteMany({
            where: { memberId: profile.id }
          });

          // Create the correct subscription state
          await prisma.subscription.create({
            data: {
              memberId: profile.id,
              planId: defaultPlan.id,
              tenantId: tenant.id,
              status: mt.status as any,
              startDate: mt.startDate,
              endDate: mt.endDate,
            }
          });
        });
      }
    }

    // Run batches of 5 concurrent operations
    for (let i = 0; i < tasks.length; i += 5) {
      await Promise.all(tasks.slice(i, i + 5).map(t => t()));
    }
    console.log(`  Created/Verified all 15 members for ${tenant.name}.`);
  }

  console.log("Sandbox data fulfillment completed successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
