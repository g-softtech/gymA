const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const plans = await prisma.membershipPlan.findMany({ select: { id: true, name: true, tenantId: true } });
  console.log(plans);
  const duplicates = plans.reduce((acc, plan) => {
    acc[plan.name] = (acc[plan.name] || 0) + 1;
    return acc;
  }, {});
  console.log("Duplicates: ", duplicates);
}

check().finally(() => prisma.$disconnect());
