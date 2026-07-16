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
          users: true, // Assuming users relation exists. If not, maybe membershipPlans or something else. Let's check schema.
        }
      }
    }
  });
  console.log(JSON.stringify(tenants, null, 2));
}

analyzeTenants()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
