const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'owner@testgym.com' }
    });
    console.log("User:", user);
  } catch (error) {
    console.error("Prisma Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
