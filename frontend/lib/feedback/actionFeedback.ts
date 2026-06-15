import { prisma } from "@/lib/prisma";
import { calculateEngagementScore } from "@/lib/analytics";

export class ActionFeedbackTracker {
  /**
   * Scans EXECUTED actions older than 7 days and measures their success
   */
  static async measurePendingFeedback() {
    // 7 days buffer for measurement
    const bufferDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const executedActions = await prisma.actionRegistry.findMany({
      where: {
        status: "EXECUTED",
        executedAt: { lte: bufferDate },
        feedback: null // Not yet measured
      },
      take: 100 // Process in batches
    });

    let processedCount = 0;

    for (const action of executedActions) {
      let success = false;
      let beforeMetric = 0;
      let afterMetric = 0;
      let delta = 0;

      try {
        const { targetId, actionType, executedAt } = action;
        if (!executedAt) continue;

        // E.g., if WIN_BACK_OFFER -> Check if they attended a class after executedAt
        if (actionType === "WIN_BACK_OFFER") {
          const attendanceAfter = await prisma.attendance.count({
            where: {
              memberId: targetId,
              checkInTime: { gt: executedAt }
            }
          });
          
          beforeMetric = 0; // 0 attendances led to churn risk
          afterMetric = attendanceAfter;
          delta = afterMetric - beforeMetric;
          success = afterMetric > 0;
        }

        // E.g., if REENGAGEMENT_MESSAGE -> Measure engagement score before vs after
        if (actionType === "REENGAGEMENT_MESSAGE") {
          // This would require historical snapshotting of engagement scores.
          // For now, we approximate: Did they attend any class in the 7 days after the message?
          const attendanceAfter = await prisma.attendance.count({
            where: {
              memberId: targetId,
              checkInTime: { gt: executedAt, lte: new Date(executedAt.getTime() + 7 * 24 * 60 * 60 * 1000) }
            }
          });
          
          beforeMetric = 0; 
          afterMetric = attendanceAfter;
          delta = afterMetric - beforeMetric;
          success = afterMetric >= 1;
        }

        // Add feedback record
        await prisma.actionFeedback.create({
          data: {
            actionId: action.id,
            beforeMetric,
            afterMetric,
            delta,
            success,
            measuredAt: new Date()
          }
        });

        processedCount++;
      } catch (e) {
        console.error(`Feedback Tracker Error on Action ${action.id}:`, e);
      }
    }

    return processedCount;
  }
}
