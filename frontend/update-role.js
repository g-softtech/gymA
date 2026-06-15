const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'thecortexsystem@gmail.com';
  
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    console.log(`User ${email} not found.`);
    return;
  }

  console.log(`Found user:`, user.id, user.role);

  const updatedUser = await prisma.user.update({
    where: { email },
    data: { role: 'SUPERADMIN' }
  });

  console.log(`Successfully updated ${email} to SUPERADMIN.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
