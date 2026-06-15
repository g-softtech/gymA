const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.tenant.findMany({ select: { id: true, name: true, slug: true } })
  .then(ts => { console.log(JSON.stringify(ts, null, 2)); })
  .finally(() => prisma.$disconnect());
