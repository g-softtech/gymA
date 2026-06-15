import { prisma } from './lib/prisma';

async function updateSadeawo() {
  const tenants = await prisma.tenant.findMany({ select: { id: true, name: true, slug: true } });
  console.log("Available Tenants:");
  console.log(tenants);
  
  if (tenants.length > 0) {
    const targetTenantId = tenants[0].id;
    console.log(`\nAssigning sadeawo85@gmail.com to Tenant: ${tenants[0].name} (${targetTenantId})...`);
    
    await prisma.user.update({
      where: { email: 'sadeawo85@gmail.com' },
      data: {
        role: "ADMIN",
        tenantId: targetTenantId
      }
    });
    console.log("Success! Role updated to ADMIN and tenantId assigned.");
  } else {
    console.log("No tenants found in DB. Cannot assign.");
  }
}

updateSadeawo().catch(console.error).finally(() => prisma.$disconnect());
