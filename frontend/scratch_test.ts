import * as dotenv from "dotenv";
import * as path from "path";
// Explicitly load .env from the current directory
dotenv.config({ path: path.resolve(__dirname, ".env") });

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Connecting to:", process.env.DATABASE_URL?.substring(0, 30) + "...");
  
  const tenant = await prisma.tenant.findUnique({
    where: { slug: "shapeme-fitness" },
    include: {
      membershipPlans: true,
      users: {
        include: {
          memberProfile: {
            include: {
              subscriptions: { include: { plan: true }, orderBy: { startDate: "desc" }, take: 1 },
            },
          },
        },
        where: { role: "MEMBER" },
        orderBy: { name: "asc" },
      },
    },
  });

  console.log("Tenant found:", !!tenant);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
