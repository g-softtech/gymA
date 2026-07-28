import { prisma } from "../lib/prisma";

async function main() {
  const tenants = await prisma.tenant.findMany({
    where: {
      trialEndsAt: null,
      billingEndsAt: null
    }
  });
  
  console.log(`Found ${tenants.length} legacy tenants with no trialEndsAt`);
  
  for (const tenant of tenants) {
    // We will retroactively give them a 14-day trial from NOW just to fix the DB state
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);
    
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { trialEndsAt }
    });
    
    console.log(`Updated ${tenant.name} (${tenant.slug}) - new trial ends at ${trialEndsAt.toLocaleDateString()}`);
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
