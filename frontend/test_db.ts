import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const plan = await prisma.membershipPlan.findFirst();
  console.log("Keys in MembershipPlan:", Object.keys(plan || {}));
}
main().catch(console.error).finally(() => prisma.$disconnect());
