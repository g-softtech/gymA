import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateTrainerPerformance } from "@/lib/analytics";

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Fetch all trainers
    const trainers = await prisma.trainerProfile.findMany({
      where: { user: { tenantId } },
      include: {
        user: { select: { name: true, email: true } }
      }
    }) as any[];

    // Batch fetch their bookings and associated class capacities
    const bookings = await prisma.booking.findMany({
      where: { tenantId, trainerId: { in: trainers.map(t => t.id) }, date: { gte: thirtyDaysAgo } },
      include: { classSession: { select: { capacity: true } } }
    });

    // Batch fetch attendances
    const attendances = await prisma.attendance.findMany({
      where: { tenantId, type: { in: ["CLASS", "TRAINER"] }, checkInTime: { gte: thirtyDaysAgo } }
    });

    const trainerMetrics = trainers.map(trainer => {
      const trainerBookings = bookings.filter(b => b.trainerId === trainer.id);
      
      // Calculate performance
      const { performanceScore, utilizationRate, retentionImpactScore } = calculateTrainerPerformance(trainerBookings, attendances);

      return {
        trainerId: trainer.id,
        name: trainer.user.name,
        email: trainer.user.email,
        performanceScore,
        utilizationRate,
        retentionImpactScore,
        totalBookings: trainerBookings.length
      };
    });

    // Sort by highest performance
    trainerMetrics.sort((a, b) => b.performanceScore - a.performanceScore);

    return NextResponse.json(trainerMetrics);

  } catch (error) {
    console.error("Trainer Analytics Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
