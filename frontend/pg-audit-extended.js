const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://neondb_owner:npg_nFY3EulQZ6dc@ep-weathered-credit-aqlu1kv0.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&connect_timeout=30"
  });

  await client.connect();

  console.log("\n=== 5. ALL ORPHANED TENANTS ===");
  // Tenants that have no User with role='ADMIN' AND "tenantId" = Tenant.id
  const orphans = await client.query(`
    SELECT t.id, t.name, t.slug 
    FROM "Tenant" t
    LEFT JOIN "User" u ON u."tenantId" = t.id AND u.role = 'ADMIN'
    WHERE u.id IS NULL
  `);
  console.log(orphans.rows);

  console.log("\n=== 6. USERS WITH role='MEMBER' AND tenantId IS NULL ===");
  const membersWithoutGyms = await client.query(`
    SELECT id, email, role, "tenantId" 
    FROM "User" 
    WHERE role = 'MEMBER' AND "tenantId" IS NULL
  `);
  console.log(membersWithoutGyms.rows);

  await client.end();
}

main().catch(console.error);
