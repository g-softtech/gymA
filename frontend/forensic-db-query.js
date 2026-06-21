/**
 * FORENSIC DB STATE QUERY
 * Queries the live DB for the exact state of the 3 test accounts.
 * Run with: node forensic-db-query.js
 */
const { Client } = require("pg");
const path = require("path");
const fs = require("fs");

// Load .env manually
const envPath = path.join(__dirname, ".env");
const envContent = fs.readFileSync(envPath, "utf8");
let DATABASE_URL = "";
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (trimmed.startsWith("DATABASE_URL=")) {
    DATABASE_URL = trimmed.slice("DATABASE_URL=".length).replace(/^["']|["']$/g, "");
    break;
  }
}

if (!DATABASE_URL) {
  console.error("ERROR: Could not find DATABASE_URL in .env");
  process.exit(1);
}

const EMAILS = [
  "thecortexsystem@gmail.com",
  "sadeawo85@gmail.com",
  "ibukunawo16@gmail.com",
];

async function run() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();

  console.log("\n" + "=".repeat(70));
  console.log("  FORENSIC DB STATE AUDIT");
  console.log("  " + new Date().toISOString());
  console.log("=".repeat(70));

  for (const email of EMAILS) {
    const res = await client.query(
      `SELECT u.id, u.email, u.name, u.role, u."tenantId", u.password IS NOT NULL as "hasPassword",
              t.slug as "tenantSlug", t.name as "tenantName",
              mp.id as "memberProfileId"
       FROM "User" u
       LEFT JOIN "Tenant" t ON t.id = u."tenantId"
       LEFT JOIN "MemberProfile" mp ON mp."userId" = u.id
       WHERE u.email = $1`,
      [email]
    );

    const row = res.rows[0];
    console.log(`\n┌─ EMAIL: ${email}`);
    if (!row) {
      console.log(`│  STATUS: NOT FOUND IN DB`);
    } else {
      console.log(`│  id              = ${row.id}`);
      console.log(`│  name            = ${row.name}`);
      console.log(`│  role            = ${row.role}`);
      console.log(`│  tenantId        = ${row.tenantId ?? "NULL"}`);
      console.log(`│  tenantSlug      = ${row.tenantSlug ?? "NULL"}`);
      console.log(`│  tenantName      = ${row.tenantName ?? "NULL"}`);
      console.log(`│  hasPassword     = ${row.hasPassword}`);
      console.log(`│  memberProfileId = ${row.memberProfileId ?? "NULL"}`);
    }
    console.log(`└${"─".repeat(60)}`);
  }

  // Also check recent users (registered in last 2 hours - from forensic tests)
  const recent = await client.query(
    `SELECT u.id, u.email, u.name, u.role, u."tenantId",
            t.slug as "tenantSlug",
            mp.id as "memberProfileId",
            u."createdAt"
     FROM "User" u
     LEFT JOIN "Tenant" t ON t.id = u."tenantId"
     LEFT JOIN "MemberProfile" mp ON mp."userId" = u.id
     WHERE u."createdAt" > NOW() - INTERVAL '3 hours'
     ORDER BY u."createdAt" DESC
     LIMIT 10`
  );

  console.log("\n" + "=".repeat(70));
  console.log("  RECENT USERS (last 3 hours) — includes forensic test accounts");
  console.log("=".repeat(70));
  for (const row of recent.rows) {
    console.log(`\n┌─ EMAIL: ${row.email} (${row.createdAt.toISOString()})`);
    console.log(`│  id              = ${row.id}`);
    console.log(`│  role            = ${row.role}`);
    console.log(`│  tenantId        = ${row.tenantId ?? "NULL"}`);
    console.log(`│  tenantSlug      = ${row.tenantSlug ?? "NULL"}`);
    console.log(`│  memberProfileId = ${row.memberProfileId ?? "NULL"}`);
    console.log(`└${"─".repeat(60)}`);
  }

  await client.end();
  console.log("\n✅ DB audit complete.\n");
}

run().catch((e) => { console.error(e); process.exit(1); });
