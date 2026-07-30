import { prisma } from '../lib/prisma';

async function main() {
  console.log('Starting TenantPlan migration...');

  try {
    // 1. Add new enum values to PostgreSQL (this is safe and native)
    console.log('Adding new enum values...');
    await prisma.$executeRawUnsafe(`ALTER TYPE "TenantPlan" ADD VALUE IF NOT EXISTS 'PROFESSIONAL';`);
    await prisma.$executeRawUnsafe(`ALTER TYPE "TenantPlan" ADD VALUE IF NOT EXISTS 'SCALEUP';`);
    await prisma.$executeRawUnsafe(`ALTER TYPE "TenantPlan" ADD VALUE IF NOT EXISTS 'APEX';`);
    
    // 2. Map existing data
    console.log('Migrating existing PRO and ENTERPRISE tenants...');
    await prisma.$executeRawUnsafe(`UPDATE "Tenant" SET plan = 'PROFESSIONAL' WHERE plan::text = 'PRO' OR plan::text = 'GROWTH';`);
    await prisma.$executeRawUnsafe(`UPDATE "Tenant" SET plan = 'APEX' WHERE plan::text = 'ENTERPRISE';`);

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
