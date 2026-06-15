require('ts-node').register({
  compilerOptions: { module: 'commonjs' }
});

const { prisma } = require('./lib/prisma');

async function main() {
  const email = "sadeawo85@gmail.com";
  
  console.log("\n=== 1. User Record ===");
  const user = await prisma.user.findUnique({
    where: { email }
  });
  console.log(user ? {
    id: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
  } : "User not found");

  if (user) {
    console.log("\n=== 2. Memberships ===");
    const memberships = await prisma.subscription.findMany({
      where: { member: { userId: user.id } }
    });
    console.log(memberships.length ? memberships : "No memberships");
    
    console.log("\n=== 3. Tenant Ownership (tenantId) ===");
    if (user.tenantId) {
      const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId } });
      console.log(tenant);
    } else {
      console.log("tenantId is null");
    }
  }

  console.log("\n=== 4. Orphaned Gyms (Matching Name/Email) ===");
  const nameMatch = email.split('@')[0].toLowerCase();
  const possibleTenants = await prisma.tenant.findMany({
    where: {
      slug: { contains: nameMatch }
    }
  });
  console.log(possibleTenants.map(t => ({ id: t.id, name: t.name, slug: t.slug })));

  console.log("\n=== 5. Admin & Super Admins ===");
  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPERADMIN"] } },
    select: { email: true, role: true, tenantId: true }
  });
  console.log(admins);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
