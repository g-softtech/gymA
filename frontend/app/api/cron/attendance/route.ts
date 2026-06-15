import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    // 1. Verify cron secret to prevent unauthorized execution
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find ALL past CONFIRMED bookings with no attendance
    // This is strictly idempotent: if a job fails, the next run will pick up the un-processed records.
    // The 1-hour buffer ensures we don't mark someone no-show while the class is just starting.
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const noShowBookings = await prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        date: { lt: oneHourAgo }, 
        attendances: { none: {} }
      },
      select: { id: true, tenantId: true, memberId: true, classSessionId: true }
    });

    let processed = 0;
    let failed = 0;

    for (const b of noShowBookings) {
      try {
        await prisma.$transaction(async (tx) => {
          // Double-check inside transaction to guarantee concurrency safety
          const existing = await tx.attendance.findFirst({
            where: { bookingId: b.id }
          });
          
          if (!existing) {
            await tx.attendance.create({
              data: {
                tenantId: b.tenantId,
                memberId: b.memberId,
                bookingId: b.id,
                method: "MANUAL",
                status: "NO_SHOW",
                type: b.classSessionId ? "CLASS" : "TRAINER"
              }
            });
            processed++;
          }
        });
      } catch (err) {
        console.error(`Failed to process NO_SHOW for booking ${b.id}:`, err);
        failed++;
        // Do NOT throw. Allow the loop to continue processing other records.
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processed} NO_SHOW records. Failed: ${failed}.`,
      processed,
      failed
    });

  } catch (error) {
    console.error("Attendance Cron Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
