import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const updated = await prisma.tenant.update({
    where: { slug: "cortexfit" },
    data: { status: "APPROVED" }
  });
  console.log(`Tenant ${updated.slug} status updated to: ${updated.status}`);
}

main().catch(console.error).finally(() => process.exit(0));
