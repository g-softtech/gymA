import { prisma } from '../lib/prisma';

async function main() {
  const events = await prisma.billingEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  console.log("Recent Billing Events:", events);

  const invoices = await prisma.saaSInvoice.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  console.log("Recent Invoices:", invoices);

  const settings = await prisma.tenantSettings.findMany({
    where: { subscriptionPlan: 'ENTERPRISE' },
    take: 1,
  });
  console.log("Tenant Settings:", settings);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
