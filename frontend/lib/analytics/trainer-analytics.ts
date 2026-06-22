import { prisma } from "@/lib/prisma";

export async function getTrainerAnalytics(tenantId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // 1. Fetch all trainers in the tenant
  const trainers = await prisma.trainerProfile.findMany({
    where: {
      user: { tenantId },
    },
    include: {
      user: { select: { name: true } },
    },
  });

  // 2. Fetch all bookings for trainers this month
  const bookings = await prisma.booking.findMany({
    where: {
      tenantId,
      trainerId: { not: null },
      date: { gte: startOfMonth },
      status: { not: "CANCELLED" },
    },
  });

  // 3. Aggregate data per trainer
  const trainerStats = trainers.map((trainer) => {
    const trainerBookings = bookings.filter((b) => b.trainerId === trainer.id);
    const sessionsBooked = trainerBookings.length;
    
    // Distinct active clients
    const clients = new Set(trainerBookings.map((b) => b.memberId));
    const activeClients = clients.size;

    // Approximate utilization percentage
    // Assuming a trainer is available for 160 hours a month, and a session is 1 hr.
    // If availability is defined in the DB, we could calculate this dynamically.
    // We will use 100 sessions per month as 100% utilization for demo purposes.
    const MAX_SESSIONS_PER_MONTH = 100;
    const utilizationPercent = Math.min(100, Math.round((sessionsBooked / MAX_SESSIONS_PER_MONTH) * 100));

    return {
      trainerId: trainer.id,
      trainerName: trainer.user.name || "Unknown",
      sessionsBooked,
      activeClients,
      utilizationPercent,
    };
  });

  return {
    totalSessionsBooked: bookings.length,
    totalActiveClients: new Set(bookings.map((b) => b.memberId)).size,
    trainers: trainerStats,
  };
}
