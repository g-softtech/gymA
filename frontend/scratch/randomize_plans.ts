import { config } from "dotenv";
config({ path: ".env" });
import { TenantPlan } from "@prisma/client";

async function randomizePlans() {
  const { prisma } = await import("../lib/prisma");
  const tenants = await prisma.tenant.findMany();
  const availablePlans: TenantPlan[] = ["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"];

  console.log(`Found ${tenants.length} gyms. Randomizing plans...`);

  for (const tenant of tenants) {
    const randomPlan = availablePlans[Math.floor(Math.random() * availablePlans.length)];
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { plan: randomPlan }
    });
    console.log(`- Updated ${tenant.name} to ${randomPlan}`);
  }

  console.log("Plan distribution complete!");
  await prisma.$disconnect();
}

randomizePlans().catch(console.error);
