import "dotenv/config";
import { prisma } from "../lib/prisma";

async function analyzeTenants() {
  const tenants = await prisma.tenant.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      isDemo: true,
      _count: {
        select: {
          users: true,
          membershipPlans: true,
          classSessions: true,
          attendances: true,
        }
      }
    },
    orderBy: {
      isDemo: 'desc'
    }
  });

  console.log("\n--- Tenant Analysis ---\n");
  console.table(
    tenants.map(t => ({
      ID: t.id.slice(-6),
      Name: t.name,
      Slug: t.slug,
      Status: t.status,
      Demo: t.isDemo ? "✅" : "❌",
      Users: t._count.users,
      Plans: t._count.membershipPlans,
      Classes: t._count.classSessions,
      Attend: t._count.attendances,
    }))
  );

  const emptyTenants = tenants.filter(t => !t.isDemo && t._count.users === 0);
  console.log(`\nFound ${emptyTenants.length} non-demo tenants with 0 users (likely safe to delete).`);
  console.log(`Found ${tenants.filter(t => t.isDemo).length} Demo tenants (Do not delete).`);
}

analyzeTenants()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });


