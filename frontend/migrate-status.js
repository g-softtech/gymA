const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Creating TenantStatus enum...");
    await prisma.$executeRawUnsafe(`CREATE TYPE "TenantStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');`);
    
    console.log("Adding status column with default APPROVED...");
    await prisma.$executeRawUnsafe(`ALTER TABLE "Tenant" ADD COLUMN "status" "TenantStatus" NOT NULL DEFAULT 'APPROVED';`);
    
    console.log("Switching default to PENDING for future rows...");
    await prisma.$executeRawUnsafe(`ALTER TABLE "Tenant" ALTER COLUMN "status" SET DEFAULT 'PENDING';`);
    
    console.log('Migration SQL executed successfully!');
  } catch (err) {
    console.error("Migration failed:", err);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
