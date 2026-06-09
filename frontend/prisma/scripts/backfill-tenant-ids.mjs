/**
 * Phase 2 — Backfill Script
 * Uses the same pg + adapter pattern as lib/prisma.ts
 * Run with: node --env-file=.env prisma/scripts/backfill-tenant-ids.mjs
 */
import { PrismaClient } from "@prisma/client";
import pkg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const { Pool } = pkg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function getTenantIdFromMember(memberId) {
  const profile = await prisma.memberProfile.findUnique({
    where: { id: memberId },
    select: { user: { select: { tenantId: true } } },
  });
  return profile?.user?.tenantId ?? null;
}

async function backfill(modelName, findFn, updateFn) {
  console.log(`\n  Backfilling ${modelName}.tenantId...`);
  const rows = await findFn();
  console.log(`  Found ${rows.length} rows with null tenantId`);
  let updated = 0, skipped = 0;
  for (const row of rows) {
    const tenantId = await getTenantIdFromMember(row.memberId);
    if (tenantId) {
      await updateFn(row.id, tenantId);
      updated++;
    } else {
      console.warn(`    ⚠  No tenant for ${modelName} id=${row.id} (memberId: ${row.memberId})`);
      skipped++;
    }
  }
  console.log(`  ✅ Updated: ${updated} | Skipped (orphan): ${skipped}`);
}

async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log("  Phase 2 — Tenant ID Backfill");
  console.log("═══════════════════════════════════════════════════");

  await backfill(
    "Subscription",
    () => prisma.subscription.findMany({ where: { tenantId: null }, select: { id: true, memberId: true } }),
    (id, tenantId) => prisma.subscription.update({ where: { id }, data: { tenantId } })
  );
  await backfill(
    "WorkoutPlan",
    () => prisma.workoutPlan.findMany({ where: { tenantId: null }, select: { id: true, memberId: true } }),
    (id, tenantId) => prisma.workoutPlan.update({ where: { id }, data: { tenantId } })
  );
  await backfill(
    "MealPlan",
    () => prisma.mealPlan.findMany({ where: { tenantId: null }, select: { id: true, memberId: true } }),
    (id, tenantId) => prisma.mealPlan.update({ where: { id }, data: { tenantId } })
  );
  await backfill(
    "FoodLog",
    () => prisma.foodLog.findMany({ where: { tenantId: null }, select: { id: true, memberId: true } }),
    (id, tenantId) => prisma.foodLog.update({ where: { id }, data: { tenantId } })
  );
  await backfill(
    "ProgressRecord",
    () => prisma.progressRecord.findMany({ where: { tenantId: null }, select: { id: true, memberId: true } }),
    (id, tenantId) => prisma.progressRecord.update({ where: { id }, data: { tenantId } })
  );

  // ── Verification ───────────────────────────────────────────
  console.log("\n─── Verification ─────────────────────────────────");
  const checks = [
    ["Subscription",   await prisma.subscription.count({ where: { tenantId: null } })],
    ["WorkoutPlan",    await prisma.workoutPlan.count({ where: { tenantId: null } })],
    ["MealPlan",       await prisma.mealPlan.count({ where: { tenantId: null } })],
    ["FoodLog",        await prisma.foodLog.count({ where: { tenantId: null } })],
    ["ProgressRecord", await prisma.progressRecord.count({ where: { tenantId: null } })],
  ];

  let allClean = true;
  for (const [name, count] of checks) {
    const label = count === 0 ? "✅ CLEAN" : `❌ ${count} NULL ROWS REMAIN`;
    console.log(`  ${name}: ${label}`);
    if (count > 0) allClean = false;
  }

  if (allClean) {
    console.log("\n✅ All tables clean — safe to run Migration B.\n");
  } else {
    console.log("\n❌ Some nulls remain — review before Migration B.\n");
    process.exit(1);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
