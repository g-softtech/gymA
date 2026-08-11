import { prisma } from "../lib/prisma";

async function checkPlans() {
  const tenants = await prisma.tenant.groupBy({
    by: ['plan'],
    _count: { _all: true }
  });
  console.log("Current Plan Distribution:");
  console.log(tenants);
}

checkPlans().catch(console.error).finally(() => prisma.$disconnect());
