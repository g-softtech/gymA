import 'dotenv/config';
import { prisma } from './lib/prisma';
async function main() {
  const jobs = await prisma.emailJob.findMany({ orderBy: { createdAt: 'desc' }, take: 10 });
  console.log(JSON.stringify(jobs, null, 2));
}
main();
