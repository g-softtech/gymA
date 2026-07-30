import { prisma } from "./lib/prisma";

async function main() {
  const jobs = await prisma.emailJob.findMany({ take: 10, orderBy: { createdAt: "desc" } });
  console.log("Latest EmailJobs:", JSON.stringify(jobs, null, 2));
  
  const logs = await prisma.emailLog.findMany({ take: 10, orderBy: { sentAt: "desc" } });
  console.log("Latest EmailLogs:", JSON.stringify(logs, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
