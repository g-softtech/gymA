import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });