import { prisma } from './lib/prisma';
prisma.pendingSignup.count().then(console.log).finally(() => prisma.$disconnect());
