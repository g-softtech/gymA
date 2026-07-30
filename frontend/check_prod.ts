import 'dotenv/config';
import { prisma } from './lib/prisma';

async function main() {
  // Check if saddyfit gym exists
  const tenant = await prisma.tenant.findUnique({ where: { slug: 'saddyfit' } });
  console.log('Tenant:', JSON.stringify(tenant, null, 2));

  // Check user
  const user = await prisma.user.findUnique({ where: { email: 'sadeawo85@gmail.com' } });
  console.log('User:', JSON.stringify(user, null, 2));

  // Check pending signup
  const pending = await prisma.pendingSignup.findFirst({ where: { email: 'sadeawo85@gmail.com' } });
  console.log('PendingSignup:', JSON.stringify(pending, null, 2));

  // Check all email logs
  const logs = await prisma.emailLog.findMany({ orderBy: { createdAt: 'desc' }, take: 10 });
  console.log('Email Logs:', JSON.stringify(logs.map(l => ({ type: l.emailType, status: l.status, subject: l.subject, sent: l.sentAt })), null, 2));
}
main().catch(console.error);
