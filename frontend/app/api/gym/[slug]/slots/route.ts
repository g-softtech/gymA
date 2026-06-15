import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const trainerId = searchParams.get("trainerId");
    const dateStr = searchParams.get("date"); // YYYY-MM-DD

    if (!trainerId || !dateStr) {
      return NextResponse.json({ error: "trainerId and date are required" }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true }
    });

    if (!tenant) {
      return NextResponse.json({ error: "Gym not found" }, { status: 404 });
    }

    const trainer = await prisma.trainerProfile.findFirst({
      where: { 
        id: trainerId,
        user: { tenantId: tenant.id }
      },
    });

    if (!trainer || !trainer.availability) {
      return NextResponse.json({ error: "Trainer or availability not found" }, { status: 404 });
    }

    const targetDate = new Date(dateStr);
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    // Get day of week (0 = Sunday, 1 = Monday)
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayOfWeek = days[targetDate.getUTCDay()];

    const availability = trainer.availability as any;
    const daySlots = availability[dayOfWeek];

    if (!daySlots || !Array.isArray(daySlots) || daySlots.length === 0) {
      return NextResponse.json({ availableSlots: [] });
    }

    // Generate possible 1-hour slots
    const possibleSlots: Date[] = [];
    
    for (const window of daySlots) {
      // window is { start: "09:00", end: "12:00" }
      if (!window.start || !window.end) continue;
      
      const [startHour, startMin] = window.start.split(":").map(Number);
      const [endHour, endMin] = window.end.split(":").map(Number);
      
      let currentHour = startHour;
      
      while (currentHour < endHour) {
        const slotTime = new Date(targetDate);
        slotTime.setUTCHours(currentHour, startMin, 0, 0);
        possibleSlots.push(slotTime);
        currentHour++; // Assume 1-hour increments for now
      }
    }

    // Fetch existing bookings for this trainer on this date
    // We query bookings from start of day to end of day
    const startOfDay = new Date(targetDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const existingBookings = await prisma.booking.findMany({
      where: {
        trainerId,
        status: { in: ["PENDING", "CONFIRMED"] },
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      select: { date: true, durationMins: true }
    });

    // Filter out slots that conflict
    // For simplicity, we assume strict 1-hour slots and 1-hour bookings
    const availableSlots = possibleSlots.filter(slot => {
      const slotMs = slot.getTime();
      const conflict = existingBookings.some(booking => {
        const bookingStart = booking.date.getTime();
        const bookingEnd = bookingStart + (booking.durationMins * 60000);
        
        // Check if slot falls within an existing booking
        // Or if an existing booking falls within this slot
        const slotEnd = slotMs + 60000 * 60; // 1 hour slot
        
        return (slotMs < bookingEnd && slotEnd > bookingStart);
      });
      return !conflict;
    });

    return NextResponse.json({ availableSlots });

  } catch (error) {
    console.error("GET /api/gym/[slug]/slots error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
