const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.trainerProfile.updateMany({
    data: { showOnWebsite: true }
  });
  console.log('Updated:', result);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
