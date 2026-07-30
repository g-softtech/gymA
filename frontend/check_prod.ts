import 'dotenv/config';
import { prisma } from './lib/prisma';

async function main() {
  // Check recent email jobs (all statuses)
  const jobs = await prisma.emailJob.findMany({ 
    orderBy: { createdAt: 'desc' }, 
    take: 10 
  });
  console.log("=== EMAIL JOBS ===");
  console.log(JSON.stringify(jobs, null, 2));

  // Check email logs (sent/failed history)
  const logs = await prisma.emailLog.findMany({ 
    orderBy: { createdAt: 'desc' }, 
    take: 10 
  });
  console.log("\n=== EMAIL LOGS ===");
  console.log(JSON.stringify(logs, null, 2));
}
main();
