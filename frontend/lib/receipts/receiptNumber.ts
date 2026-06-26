import { prisma } from "@/lib/prisma";

export async function generateReceiptNumber(tenantId: string): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const yearMonth = `${year}${month}`;

  // Atomic upsert with increment guarantees sequential numbers without race conditions
  const sequence = await prisma.receiptSequence.upsert({
    where: {
      tenantId_yearMonth: {
        tenantId,
        yearMonth,
      },
    },
    update: {
      lastValue: {
        increment: 1,
      },
    },
    create: {
      tenantId,
      yearMonth,
      lastValue: 1,
    },
  });

  // Format: GYM-YYYYMM-000001
  const paddedValue = String(sequence.lastValue).padStart(6, "0");
  return `GYM-${yearMonth}-${paddedValue}`;
}
