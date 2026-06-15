import { prisma } from "@/lib/prisma";

export type ActionStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXECUTED" | "EXPIRED";

export interface RegisterActionInput {
  tenantId: string;
  actionType: string;
  targetId: string;
  context: string;
}

export class ActionRegistry {
  static async registerAction(input: RegisterActionInput) {
    // Avoid duplicating identical PENDING actions for the same target
    const existing = await prisma.actionRegistry.findFirst({
      where: {
        tenantId: input.tenantId,
        targetId: input.targetId,
        actionType: input.actionType,
        status: "PENDING"
      }
    });

    if (existing) {
      return existing; // Already queued
    }

    return prisma.actionRegistry.create({
      data: {
        ...input,
        status: "PENDING"
      }
    });
  }

  static async approveAction(id: string) {
    return prisma.actionRegistry.update({
      where: { id },
      data: { status: "APPROVED" }
    });
  }

  static async rejectAction(id: string) {
    return prisma.actionRegistry.update({
      where: { id },
      data: { status: "REJECTED" }
    });
  }

  static async expireStaleActions() {
    // Expire pending actions older than 3 days
    const staleDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    return prisma.actionRegistry.updateMany({
      where: {
        status: "PENDING",
        createdAt: { lt: staleDate }
      },
      data: { status: "EXPIRED" }
    });
  }
}
