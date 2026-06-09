// @ts-nocheck
/**
 * Phase 2 — Backfill Script
 *
 * Populates tenantId on the 5 tables that received it as a nullable column
 * in Migration A. The tenantId is resolved by walking up the join chain:
 *
 *   Subscription / WorkoutPlan / MealPlan / FoodLog / ProgressRecord
 *     → memberId → MemberProfile.userId → User.tenantId
 *
 * Run this script ONCE after Migration A, verify zero nulls, then run
 * Migration B to make the columns non-nullable.
 *
 * Usage:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/scripts/backfill-tenant-ids.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Helper: resolve tenantId from a memberId ─────────────────────────────────
async function getTenantIdFromMember(memberId: string): Promise<string | null> {
  const profile = await prisma.memberProfile.findUnique({
    where: { id: memberId },
    select: { user: { select: { tenantId: true } } },
  });
  return profile?.user?.tenantId ?? null;
}

// ─── Individual table backfills ───────────────────────────────────────────────

async function backfillSubscriptions() {
  console.log("\n[1/5] Backfilling Subscription.tenantId...");
  const rows = await prisma.subscription.findMany({
    where: { tenantId: null },
    select: { id: true, memberId: true },
  });
  console.log(`  Found ${rows.length} rows with null tenantId`);

  let updated = 0;
  let skipped = 0;
  for (const row of rows) {
    const tenantId = await getTenantIdFromMember(row.memberId);
    if (tenantId) {
      await prisma.subscription.update({ where: { id: row.id }, data: { tenantId } });
      updated++;
    } else {
      console.warn(`  ⚠️  No tenantId found for Subscription ${row.id} (memberId: ${row.memberId}) — skipping`);
      skipped++;
    }
  }
  console.log(`  ✅ Updated: ${updated} | Skipped (orphan): ${skipped}`);
}

async function backfillWorkoutPlans() {
  console.log("\n[2/5] Backfilling WorkoutPlan.tenantId...");
  const rows = await prisma.workoutPlan.findMany({
    where: { tenantId: null },
    select: { id: true, memberId: true },
  });
  console.log(`  Found ${rows.length} rows with null tenantId`);

  let updated = 0;
  let skipped = 0;
  for (const row of rows) {
    const tenantId = await getTenantIdFromMember(row.memberId);
    if (tenantId) {
      await prisma.workoutPlan.update({ where: { id: row.id }, data: { tenantId } });
      updated++;
    } else {
      console.warn(`  ⚠️  No tenantId found for WorkoutPlan ${row.id} — skipping`);
      skipped++;
    }
  }
  console.log(`  ✅ Updated: ${updated} | Skipped (orphan): ${skipped}`);
}

async function backfillMealPlans() {
  console.log("\n[3/5] Backfilling MealPlan.tenantId...");
  const rows = await prisma.mealPlan.findMany({
    where: { tenantId: null },
    select: { id: true, memberId: true },
  });
  console.log(`  Found ${rows.length} rows with null tenantId`);

  let updated = 0;
  let skipped = 0;
  for (const row of rows) {
    const tenantId = await getTenantIdFromMember(row.memberId);
    if (tenantId) {
      await prisma.mealPlan.update({ where: { id: row.id }, data: { tenantId } });
      updated++;
    } else {
      console.warn(`  ⚠️  No tenantId found for MealPlan ${row.id} — skipping`);
      skipped++;
    }
  }
  console.log(`  ✅ Updated: ${updated} | Skipped (orphan): ${skipped}`);
}

async function backfillFoodLogs() {
  console.log("\n[4/5] Backfilling FoodLog.tenantId...");
  const rows = await prisma.foodLog.findMany({
    where: { tenantId: null },
    select: { id: true, memberId: true },
  });
  console.log(`  Found ${rows.length} rows with null tenantId`);

  let updated = 0;
  let skipped = 0;
  for (const row of rows) {
    const tenantId = await getTenantIdFromMember(row.memberId);
    if (tenantId) {
      await prisma.foodLog.update({ where: { id: row.id }, data: { tenantId } });
      updated++;
    } else {
      console.warn(`  ⚠️  No tenantId found for FoodLog ${row.id} — skipping`);
      skipped++;
    }
  }
  console.log(`  ✅ Updated: ${updated} | Skipped (orphan): ${skipped}`);
}

async function backfillProgressRecords() {
  console.log("\n[5/5] Backfilling ProgressRecord.tenantId...");
  const rows = await prisma.progressRecord.findMany({
    where: { tenantId: null },
    select: { id: true, memberId: true },
  });
  console.log(`  Found ${rows.length} rows with null tenantId`);

  let updated = 0;
  let skipped = 0;
  for (const row of rows) {
    const tenantId = await getTenantIdFromMember(row.memberId);
    if (tenantId) {
      await prisma.progressRecord.update({ where: { id: row.id }, data: { tenantId } });
      updated++;
    } else {
      console.warn(`  ⚠️  No tenantId found for ProgressRecord ${row.id} — skipping`);
      skipped++;
    }
  }
  console.log(`  ✅ Updated: ${updated} | Skipped (orphan): ${skipped}`);
}

// ─── Verification: confirm zero null rows after backfill ──────────────────────
async function verifyNoNulls() {
  console.log("\n─── Verification ───────────────────────────────────────────");
  const tables = [
    { name: "Subscription",    count: await prisma.subscription.count({ where: { tenantId: null } }) },
    { name: "WorkoutPlan",     count: await prisma.workoutPlan.count({ where: { tenantId: null } }) },
    { name: "MealPlan",        count: await prisma.mealPlan.count({ where: { tenantId: null } }) },
    { name: "FoodLog",         count: await prisma.foodLog.count({ where: { tenantId: null } }) },
    { name: "ProgressRecord",  count: await prisma.progressRecord.count({ where: { tenantId: null } }) },
  ];

  let allClean = true;
  for (const { name, count } of tables) {
    const status = count === 0 ? "✅ CLEAN" : `❌ ${count} NULL ROWS REMAIN`;
    console.log(`  ${name}: ${status}`);
    if (count > 0) allClean = false;
  }

  if (allClean) {
    console.log("\n✅ All tables clean. Safe to run Migration B (non-nullable constraints).\n");
  } else {
    console.log("\n❌ Some tables still have null tenantId rows.");
    console.log("   These are likely orphaned records (member with no tenant assigned).");
    console.log("   Review and clean them before running Migration B.\n");
    process.exit(1);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Phase 2 — Tenant ID Backfill Script");
  console.log("═══════════════════════════════════════════════════════════");

  try {
    await backfillSubscriptions();
    await backfillWorkoutPlans();
    await backfillMealPlans();
    await backfillFoodLogs();
    await backfillProgressRecords();
    await verifyNoNulls();
  } catch (err) {
    console.error("\n❌ Backfill error:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
