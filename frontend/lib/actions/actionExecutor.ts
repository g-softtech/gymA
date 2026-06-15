import { prisma } from "@/lib/prisma";
import { NotificationProviderFactory } from "../providers/notificationProvider";

export class ActionExecutor {
  static async processApprovedActions() {
    // 1. Fetch all APPROVED actions
    const actions = await prisma.actionRegistry.findMany({
      where: { status: "APPROVED" },
      take: 50 // process in batches
    });

    if (actions.length === 0) return 0;

    let executedCount = 0;

    for (const action of actions) {
      // 2. Fetch Target details (e.g., member email)
      let targetContact = "unknown@example.com";
      
      // We assume targetId points to a MemberProfile or TrainerProfile.
      // In a real app we'd query dynamically based on context, but here we approximate:
      try {
        const member = await prisma.memberProfile.findUnique({
          where: { id: action.targetId },
          include: { user: true }
        });
        if (member && member.user.email) targetContact = member.user.email;
      } catch (e) {
        // Ignore error if it's a trainer id etc.
      }

      // 3. Match action type to handler & Dispatch via Provider
      const provider = NotificationProviderFactory.getProvider(action.actionType);
      const message = `Executing campaign: ${action.actionType}\nContext: ${action.context}`;
      
      const success = await provider.send(targetContact, message, { actionId: action.id });

      // 4. Update status -> EXECUTED (or handle failure)
      if (success) {
        await prisma.actionRegistry.update({
          where: { id: action.id },
          data: { 
            status: "EXECUTED",
            executedAt: new Date()
          }
        });
        executedCount++;
      }
    }

    return executedCount;
  }
}
