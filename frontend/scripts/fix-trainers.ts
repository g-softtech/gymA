import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("Fixing showOnWebsite for all trainers...");
  const result = await prisma.trainerProfile.updateMany({
    where: {
      showOnWebsite: false
    },
    data: {
      showOnWebsite: true
    }
  });
  console.log(`Updated ${result.count} trainers to showOnWebsite = true.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
