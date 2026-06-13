require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'owner@testgym.com' }
    });
    console.log("User:", user ? "Found - " + user.email : "NOT FOUND");
  } catch (error) {
    console.error("Prisma Error:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
