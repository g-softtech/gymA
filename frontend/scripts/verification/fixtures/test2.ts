import { prisma } from '@/lib/prisma'; async function someFunction() { await prisma.tenant.update({ where: { id: '1' }, data: { billingStatus: 'ACTIVE' } }); }
