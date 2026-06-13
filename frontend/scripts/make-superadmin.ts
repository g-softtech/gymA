import { prisma } from "../lib/prisma";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.log("==============================");
    console.log("Currently registered emails:");
    const users = await prisma.user.findMany({ select: { email: true, role: true } });
    if (users.length === 0) console.log("  (No users found)");
    users.forEach((u) => console.log(`  - ${u.email} [${u.role}]`));
    console.log("==============================");
    console.log("\nPlease run again with your exact email.");
    console.log("Example: npx tsx scripts/make-superadmin.ts myemail@example.com");
    process.exit(1);
  }

  try {
    const user = await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { role: "SUPERADMIN" },
    });

    console.log(`✅ Successfully updated ${user.email} to SUPERADMIN!`);
  } catch (error) {
    console.error("❌ Failed to update user. Does the email exist?");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
