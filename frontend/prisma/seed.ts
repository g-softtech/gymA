import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Create a Test Tenant (Gym)
  const tenant = await prisma.tenant.upsert({
    where: { slug: "ironforge" },
    update: {},
    create: {
      name: "Iron Forge Fitness",
      slug: "ironforge",
    },
  });
  console.log("✅ Seeded Tenant:", tenant.name);

  // 2. Create a Test Admin User for this Tenant
  const admin = await prisma.user.upsert({
    where: { email: "admin@ironforge.com" },
    update: {},
    create: {
      email: "admin@ironforge.com",
      role: "ADMIN",
      tenantId: tenant.id,
    },
  });
  console.log("✅ Seeded Admin:", admin.email);

  // 3. Create Membership Plans for the Tenant
  await prisma.membershipPlan.createMany({
    data: [
      {
        name: "Basic Monthly",
        price: 29.99,
        durationDays: 30,
        tenantId: tenant.id,
      },
      {
        name: "Premium Monthly",
        price: 49.99,
        durationDays: 30,
        tenantId: tenant.id,
      },
      {
        name: "Annual Pass",
        price: 499.99,
        durationDays: 365,
        tenantId: tenant.id,
      },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Seeded Membership Plans for", tenant.name);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });