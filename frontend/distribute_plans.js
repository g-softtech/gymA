require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Finding all sandbox/demo tenants...');
  
  // Find all tenants that have membership plans
  const tenants = await prisma.tenant.findMany({
    include: {
      membershipPlans: true
    }
  });

  console.log(`Found ${tenants.length} total tenants.`);

  let totalUpdated = 0;

  for (const tenant of tenants) {
    if (tenant.membershipPlans.length <= 1) {
      console.log(`Skipping ${tenant.slug} (has 1 or 0 plans)`);
      continue;
    }

    console.log(`\nProcessing ${tenant.name} (${tenant.slug}) - ${tenant.membershipPlans.length} plans`);

    const subscriptions = await prisma.subscription.findMany({
      where: {
        tenantId: tenant.id,
        member: {
          user: {
            role: 'MEMBER'
          }
        }
      }
    });

    if (subscriptions.length === 0) {
      console.log(`No member subscriptions found for ${tenant.slug}`);
      continue;
    }

    let updatedCount = 0;
    for (const sub of subscriptions) {
      // Pick a random plan
      const randomPlan = tenant.membershipPlans[Math.floor(Math.random() * tenant.membershipPlans.length)];
      
      if (sub.planId !== randomPlan.id) {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { planId: randomPlan.id }
        });
        updatedCount++;
      }
    }
    console.log(`Updated ${updatedCount} / ${subscriptions.length} subscriptions for ${tenant.slug}`);
    totalUpdated += updatedCount;
  }

  console.log(`\n======================================`);
  console.log(`Successfully completed! Total subscriptions updated across all tenants: ${totalUpdated}`);
  console.log(`======================================\n`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
