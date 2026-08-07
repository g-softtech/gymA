import dotenv from "dotenv";
dotenv.config();
dotenv.config({ path: ".env.local", override: true });

async function checkTenants() {
  const { prisma } = await import("../../lib/prisma");

  const tenants = await prisma.tenant.findMany({
    where: { isDemo: true },
    select: { slug: true, name: true, users: { select: { email: true, role: true } } }
  });

  console.log(JSON.stringify(tenants, null, 2));
}

checkTenants().finally(() => process.exit(0));
