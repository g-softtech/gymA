import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const hash = "$2b$10$WTD.pDYyM7p1AYp/cnANoeI6pd4tboTjwvtcFy8823E4Ay0RFiSYS";
  
  const updated = await prisma.user.updateMany({
    where: {
      email: {
        contains: "@demo.cortexfit.com"
      }
    },
    data: {
      password: hash
    }
  });

  console.log(`Updated ${updated.count} demo users with password 'password123'`);
}

main().catch(console.error).finally(() => process.exit(0));
