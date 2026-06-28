import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: "cortexfit" }
  });

  if (!tenant) {
    console.error("Tenant cortexfit not found");
    process.exit(1);
  }

  await prisma.user.upsert({
    where: { email: "admin@demo.cortexfit.com" },
    update: {
      role: "ADMIN",
      tenantId: tenant.id
    },
    create: {
      name: "Cortex Gym Owner",
      email: "admin@demo.cortexfit.com",
      password: "$2b$10$WTD.pDYyM7p1AYp/cnANoeI6pd4tboTjwvtcFy8823E4Ay0RFiSYS", // password123
      role: "ADMIN",
      tenantId: tenant.id
    }
  });

  console.log("Admin user created/updated successfully.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
