const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedTestUsers() {
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create a Super Admin
  const superadmin = await prisma.user.upsert({
    where: { email: 'superadmin@cortexfit.test' },
    update: { role: 'SUPERADMIN', password: passwordHash },
    create: {
      email: 'superadmin@cortexfit.test',
      name: 'Test SuperAdmin',
      password: passwordHash,
      role: 'SUPERADMIN'
    }
  });

  console.log(`✅ Super Admin ready: ${superadmin.email} / password123`);

  // 2. Create a Gym Owner with Tenant
  let tenant = await prisma.tenant.findFirst({ where: { slug: 'test-gym' } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Test Gym',
        slug: 'test-gym',
        plan: 'FREE'
      }
    });
  }

  const gymOwner = await prisma.user.upsert({
    where: { email: 'owner@cortexfit.test' },
    update: { role: 'ADMIN', tenantId: tenant.id, password: passwordHash },
    create: {
      email: 'owner@cortexfit.test',
      name: 'Test Gym Owner',
      password: passwordHash,
      role: 'ADMIN',
      tenantId: tenant.id
    }
  });

  console.log(`✅ Gym Owner ready: ${gymOwner.email} / password123`);
  
  await prisma.$disconnect();
}

seedTestUsers().catch(e => {
  console.error(e);
  process.exit(1);
});
