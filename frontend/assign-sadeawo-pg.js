const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  await client.connect();
  
  const tenants = await client.query('SELECT id, name, slug FROM "Tenant" LIMIT 1');
  if (tenants.rows.length > 0) {
    const tenantId = tenants.rows[0].id;
    console.log(`Assigning sadeawo85@gmail.com to Tenant: ${tenants.rows[0].name} (${tenantId})...`);
    
    await client.query(`UPDATE "User" SET role = 'ADMIN', "tenantId" = $1 WHERE email = 'sadeawo85@gmail.com'`, [tenantId]);
    console.log("Success! Role updated to ADMIN and tenantId assigned.");
  } else {
    console.log("No tenants found in DB.");
  }
  
  await client.end();
}

run().catch(console.error);
