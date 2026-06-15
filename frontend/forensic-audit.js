/**
 * FORENSIC AUDIT — CortexFit Auth/Tenant Investigation
 * Queries the live Neon DB to establish ground truth for the two reported users.
 * Run with: node forensic-audit.js
 */

const { Client } = require("pg");

const DATABASE_URL =
  "postgresql://neondb_owner:npg_nFY3EulQZ6dc@ep-weathered-credit-aqlu1kv0.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&connect_timeout=30";

const EMAILS = ["sadeawo85@gmail.com", "ibukunawo16@gmail.com"];

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  console.log("\n============================================================");
  console.log(" FORENSIC AUDIT — CortexFit DB State");
  console.log("============================================================\n");

  // ── 1. User rows ──────────────────────────────────────────────────────────
  console.log("── QUERY 1: User rows for the two reported accounts ─────────");
  const users = await client.query(
    `SELECT id, email, role, "tenantId", "emailVerified", password IS NOT NULL AS "hasPassword"
     FROM "User"
     WHERE email = ANY($1)`,
    [EMAILS]
  );
  console.table(users.rows);

  const userIds = users.rows.map((r) => r.id);
  const tenantIds = users.rows.map((r) => r.tenantId).filter(Boolean);

  // ── 2. All tenants ────────────────────────────────────────────────────────
  console.log("\n── QUERY 2: All Tenant rows ─────────────────────────────────");
  const tenants = await client.query(
    `SELECT id, name, slug, plan, "isActive", "trialEndsAt"
     FROM "Tenant"
     ORDER BY "trialEndsAt" DESC`
  );
  console.table(tenants.rows);

  // ── 3. All users whose tenantId matches any tenant found above ────────────
  console.log("\n── QUERY 3: All Users sharing tenantId with the two accounts ──");
  if (tenantIds.length > 0) {
    const sharedTenantUsers = await client.query(
      `SELECT id, email, role, "tenantId"
       FROM "User"
       WHERE "tenantId" = ANY($1)`,
      [tenantIds]
    );
    console.table(sharedTenantUsers.rows);
  } else {
    console.log("  → Neither account has a tenantId set in User table.");
  }

  // ── 4. Account (OAuth) rows — check for duplicate identity ───────────────
  console.log("\n── QUERY 4: NextAuth Account rows (OAuth identity check) ────");
  if (userIds.length > 0) {
    const accounts = await client.query(
      `SELECT "userId", provider, "providerAccountId"
       FROM "Account"
       WHERE "userId" = ANY($1)`,
      [userIds]
    );
    console.table(accounts.rows);
  }

  // ── 5. MemberProfile rows ─────────────────────────────────────────────────
  console.log("\n── QUERY 5: MemberProfile rows for these users ─────────────");
  if (userIds.length > 0) {
    const profiles = await client.query(
      `SELECT id, "userId"
       FROM "MemberProfile"
       WHERE "userId" = ANY($1)`,
      [userIds]
    );
    console.table(profiles.rows);
  }

  // ── 6. Subscription rows — check if membership is stored here ────────────
  console.log("\n── QUERY 6: Subscription rows linked to these MemberProfiles ─");
  if (userIds.length > 0) {
    const subs = await client.query(
      `SELECT s.id, s."memberId", s."planId", s."tenantId", s.status, s."startDate", s."endDate"
       FROM "Subscription" s
       JOIN "MemberProfile" mp ON mp.id = s."memberId"
       WHERE mp."userId" = ANY($1)`,
      [userIds]
    );
    console.table(subs.rows);
  }

  // ── 7. Check for ANY duplicate User rows with the same email ─────────────
  console.log("\n── QUERY 7: Duplicate user detection (same email, different id) ─");
  const dupes = await client.query(
    `SELECT email, COUNT(*) as count, array_agg(id) as ids
     FROM "User"
     WHERE email = ANY($1)
     GROUP BY email`,
    [EMAILS]
  );
  console.table(dupes.rows);

  // ── 8. TenantSettings for any tenants owned by these users ───────────────
  console.log("\n── QUERY 8: TenantSettings for tenants found ───────────────");
  if (tenantIds.length > 0) {
    const settings = await client.query(
      `SELECT "tenantId", subdomain, "customDomain", "subscriptionPlan", "subscriptionStatus"
       FROM "TenantSettings"
       WHERE "tenantId" = ANY($1)`,
      [tenantIds]
    );
    console.table(settings.rows);
  } else {
    console.log("  → No tenantIds to look up settings for.");
  }

  // ── 9. Full tenant count — sanity check ──────────────────────────────────
  console.log("\n── QUERY 9: Total User + Tenant counts ─────────────────────");
  const counts = await client.query(
    `SELECT
       (SELECT COUNT(*) FROM "User") AS total_users,
       (SELECT COUNT(*) FROM "User" WHERE "tenantId" IS NOT NULL) AS users_with_tenant,
       (SELECT COUNT(*) FROM "User" WHERE "tenantId" IS NULL) AS users_without_tenant,
       (SELECT COUNT(*) FROM "Tenant") AS total_tenants`
  );
  console.table(counts.rows);

  // ── 10. Users whose role is ADMIN but have no tenantId ───────────────────
  console.log("\n── QUERY 10: ADMIN users with NO tenantId (orphaned admins) ─");
  const orphanAdmins = await client.query(
    `SELECT id, email, role, "tenantId"
     FROM "User"
     WHERE role = 'ADMIN' AND "tenantId" IS NULL`
  );
  console.table(orphanAdmins.rows);

  // ── 11. MEMBER users with a tenantId (correctly joined members) ──────────
  console.log("\n── QUERY 11: MEMBER users WITH a tenantId ───────────────────");
  const memberWithTenant = await client.query(
    `SELECT id, email, role, "tenantId"
     FROM "User"
     WHERE role = 'MEMBER' AND "tenantId" IS NOT NULL`
  );
  console.table(memberWithTenant.rows);

  await client.end();

  console.log("\n============================================================");
  console.log(" AUDIT COMPLETE");
  console.log("============================================================\n");
}

main().catch((err) => {
  console.error("AUDIT FAILED:", err);
  process.exit(1);
});
