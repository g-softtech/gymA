const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://neondb_owner:npg_nFY3EulQZ6dc@ep-weathered-credit-aqlu1kv0.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&connect_timeout=30"
  });

  await client.connect();
  const results = {};

  // 1. All users
  const res1 = await client.query(`SELECT id, email, role, "tenantId" FROM "User"`);
  results.allUsers = res1.rows;

  // 2. All tenants
  const res2 = await client.query(`SELECT id, name, slug FROM "Tenant"`);
  results.allTenants = res2.rows;

  // 3. Count users by role
  const res3 = await client.query(`SELECT role, COUNT(*) as count FROM "User" GROUP BY role`);
  results.userRoleCounts = res3.rows;

  // 4. For every tenant, show linked users
  const res4 = await client.query(`
    SELECT t.id as "tenantId", t.name as "tenantName", u.id as "userId", u.email, u.role
    FROM "Tenant" t
    LEFT JOIN "User" u ON u."tenantId" = t.id
  `);
  
  const tenantsWithUsers = {};
  res4.rows.forEach(r => {
    if (!tenantsWithUsers[r.tenantId]) {
      tenantsWithUsers[r.tenantId] = {
        tenantId: r.tenantId,
        tenantName: r.tenantName,
        users: []
      };
    }
    if (r.userId) {
      tenantsWithUsers[r.tenantId].users.push({ id: r.userId, email: r.email, role: r.role });
    }
  });
  results.tenantsWithUsers = Object.values(tenantsWithUsers);

  // 5. sadeawo85@gmail.com
  const res5 = await client.query(`SELECT id, email, role, "tenantId" FROM "User" WHERE email='sadeawo85@gmail.com'`);
  results.sadeawoUser = res5.rows;

  if (res5.rows.length > 0) {
    const res6 = await client.query(`SELECT provider, type FROM "Account" WHERE "userId"=$1`, [res5.rows[0].id]);
    results.sadeawoAccounts = res6.rows;
  } else {
    results.sadeawoAccounts = [];
  }

  console.log(JSON.stringify(results, null, 2));

  await client.end();
}

main().catch(console.error);
