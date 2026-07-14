import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Fix plans with durationDays <= 0
    const updatedPlans = await prisma.membershipPlan.updateMany({
      where: { durationDays: { lte: 0 } },
      data: { durationDays: 30 }
    });

    // 2. Find any subscriptions where startDate == endDate
    const badSubs = await prisma.subscription.findMany({
      where: {
        // We can't do column comparison easily in Prisma, so we fetch all ACTIVE or REPLACED recently
        status: { in: ["ACTIVE", "REPLACED"] }
      }
    });

    let fixedCount = 0;
    for (const sub of badSubs) {
      if (sub.startDate.getTime() === sub.endDate.getTime()) {
        const newEndDate = new Date(sub.endDate);
        newEndDate.setDate(newEndDate.getDate() + 30);
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { endDate: newEndDate }
        });
        fixedCount++;
      }
    }

    return NextResponse.json({ 
      plansFixed: updatedPlans.count, 
      subsFixed: fixedCount,
      badSubsChecked: badSubs.length
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
