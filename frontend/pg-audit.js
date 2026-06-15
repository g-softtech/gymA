const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://neondb_owner:npg_nFY3EulQZ6dc@ep-weathered-credit-aqlu1kv0.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&connect_timeout=30"
  });

  await client.connect();

  console.log("\n=== 1. User Record for sadeawo85@gmail.com ===");
  const res1 = await client.query(`SELECT id, email, role, "tenantId" FROM "User" WHERE email='sadeawo85@gmail.com'`);
  console.log(res1.rows);

  console.log("\n=== 2. All Tenants ===");
  const res2 = await client.query(`SELECT id, name, slug FROM "Tenant" LIMIT 10`);
  console.log(res2.rows);

  console.log("\n=== 3. Any Tenant matching sadeawo85 ===");
  const res3 = await client.query(`SELECT id, name, slug FROM "Tenant" WHERE slug LIKE '%sadeawo%'`);
  console.log(res3.rows);

  console.log("\n=== 5. Users who are Admin/Superadmin ===");
  const res4 = await client.query(`SELECT email, role, "tenantId" FROM "User" WHERE role IN ('ADMIN', 'SUPERADMIN')`);
  console.log(res4.rows);

  await client.end();
}

main().catch(console.error);
