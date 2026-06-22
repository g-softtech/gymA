import { prisma } from "../lib/prisma";

async function main() {
  const result = await prisma.trainerProfile.updateMany({
    data: { showOnWebsite: true }
  });
  console.log('Updated:', result);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
