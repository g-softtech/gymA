import { Attendance, Booking, Subscription, Transaction } from "@prisma/client";

/**
 * Calculates a deterministic Engagement Score (0-100)
 * Inputs:
 * - attendances: User's attendances in the last 30 days
 * - bookings: User's bookings in the last 30 days
 * - activeMonths: How many months the user has been active
 */
export function calculateEngagementScore(
  attendances: Attendance[],
  bookings: Booking[],
  activeMonths: number
): number {
  let score = 0;

  // 1. Attendance Frequency (40%)
  // Target: 12x a month (3x a week). 12+ = 40 pts.
  const attendanceScore = Math.min((attendances.length / 12) * 40, 40);
  score += attendanceScore;

  // 2. Booking Completion Rate (30%)
  // Attended vs Total Booked
  const totalBookings = bookings.length;
  if (totalBookings > 0) {
    const attendedBookings = bookings.filter((b) =>
      attendances.some((a) => a.bookingId === b.id)
    ).length;
    score += (attendedBookings / totalBookings) * 30;
  } else if (attendances.length > 0) {
    // If they just walk-in without booking, give full booking credit based on attendance
    score += 30;
  }

  // 3. Longevity (20%)
  // Target: 6 months for max points
  const longevityScore = Math.min((activeMonths / 6) * 20, 20);
  score += longevityScore;

  // 4. Session Diversity (10%)
  // Did they do both class and trainer?
  const hasClass = attendances.some((a) => a.type === "CLASS");
  const hasTrainer = attendances.some((a) => a.type === "TRAINER");
  const hasGeneral = attendances.some((a) => a.type === "GENERAL");

  let diversityScore = 0;
  const types = [hasClass, hasTrainer, hasGeneral].filter(Boolean).length;
  if (types >= 2) diversityScore = 10;
  else if (types === 1) diversityScore = 5;

  score += diversityScore;

  return Math.round(Math.min(Math.max(score, 0), 100));
}

/**
 * Evaluates Churn Risk based on strict V1 Rules.
 * Inputs:
 * - attendancesLast30: array of last 30 days
 * - attendancesPrev30: array of days -60 to -30
 * - bookings: Recent bookings (to check NO_SHOW)
 * - hasActiveSub: boolean
 */
export function calculateChurnRisk(
  attendancesLast30: Attendance[],
  attendancesPrev30: Attendance[],
  bookings: Booking[],
  hasActiveSub: boolean
): { score: number; risk: "LOW" | "MEDIUM" | "HIGH"; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  // Weight 1: Active sub + no attendance in last 14 days (+40)
  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const attendedLast14 = attendancesLast30.some(
    (a) => new Date(a.checkInTime) >= fourteenDaysAgo
  );

  if (hasActiveSub && !attendedLast14) {
    score += 40;
    reasons.push("No attendance in the last 14 days while active");
  }

  // Weight 2: Attendance drop > 60% (+30)
  const prevCount = attendancesPrev30.length;
  const currCount = attendancesLast30.length;
  if (prevCount > 2 && currCount <= prevCount * 0.4) {
    score += 30;
    reasons.push(`Attendance dropped by >60% (from ${prevCount} to ${currCount})`);
  }

  // Weight 3: 3+ NO_SHOW (+20)
  const noShows = attendancesLast30.filter((a) => a.status === "NO_SHOW").length;
  if (noShows >= 3) {
    score += 20;
    reasons.push(`${noShows} recent NO_SHOW records`);
  }

  let risk: "LOW" | "MEDIUM" | "HIGH" = "LOW";
  if (score > 60) {
    risk = "HIGH";
  } else if (score >= 30) {
    risk = "MEDIUM";
  }

  return { score, risk, reasons };
}

/**
 * Correlates Revenue + Behavior
 */
export function calculateLTV(
  transactions: Transaction[],
  engagementScore: number
): { totalSpent: number; predictedLtv: number } {
  const totalSpent = transactions
    .filter((t) => t.status === "SUCCESS")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Simple V1 LTV model: 
  // If engagement > 80, we predict they spend 12x more of what they spent on avg so far.
  // If engagement < 30, we predict 1x more.
  let multiplier = 1;
  if (engagementScore >= 80) multiplier = 1.5;
  else if (engagementScore >= 50) multiplier = 1.2;
  else multiplier = 1.0;

  const predictedLtv = Math.round(totalSpent * multiplier);

  return { totalSpent, predictedLtv };
}

/**
 * Calculates Trainer Performance metrics based on Bookings and Attendances.
 */
export function calculateTrainerPerformance(
  bookings: (Booking & { classSession: any | null })[],
  attendances: Attendance[]
): { performanceScore: number; utilizationRate: number; retentionImpactScore: number } {
  if (bookings.length === 0) return { performanceScore: 0, utilizationRate: 0, retentionImpactScore: 0 };

  // 1. Booking Conversion (Attended vs Total)
  const totalBookings = bookings.length;
  const attendedBookings = bookings.filter((b) =>
    attendances.some((a) => a.bookingId === b.id && a.status === "PRESENT")
  ).length;
  const conversionRate = attendedBookings / totalBookings; // 0 to 1

  // 2. Class Fill Rate (Utilization)
  // For group classes, how many people booked out of total capacity?
  // We approximate capacity via classSession.capacity if available
  let totalCapacity = 0;
  let totalFilled = 0;
  
  bookings.forEach(b => {
    if (b.classSessionId && b.classSession?.capacity) {
      totalCapacity += b.classSession.capacity;
      totalFilled += 1; // 1 booking = 1 filled spot
    } else {
      // 1-on-1 session
      totalCapacity += 1;
      totalFilled += 1;
    }
  });

  const utilizationRate = totalCapacity > 0 ? (totalFilled / totalCapacity) : 0;

  // 3. Retention Impact Score (derived from conversion)
  // If conversion is high, impact is high.
  const retentionImpactScore = Math.round(conversionRate * 100);

  // 4. Overall Performance Score (0-100)
  // Weighted: 60% conversion, 40% utilization
  const performanceScore = Math.round((conversionRate * 60) + (utilizationRate * 40));

  return {
    performanceScore,
    utilizationRate: Math.round(utilizationRate * 100), // convert to %
    retentionImpactScore
  };
}
