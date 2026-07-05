import { prisma } from "./prisma";
import { logger } from "./logger";

export interface LockConfig {
  lockId: string;
  timeoutMs: number;
  correlationId?: string;
}

/**
 * Attempts to acquire a distributed lock using Postgres.
 * Returns true if acquired, false if already locked by another process.
 */
export async function acquireLock({ lockId, timeoutMs, correlationId }: LockConfig): Promise<boolean> {
  const cidStr = correlationId ? `[${correlationId}] ` : "";
  const now = new Date();
  const expiresAt = new Date(now.getTime() + timeoutMs);

  try {
    const lock = await prisma.cronLock.findUnique({ where: { id: lockId } });

    if (lock) {
      if (now < lock.expiresAt) {
        // Lock is currently held and hasn't expired
        logger.info(`${cidStr}Lock [${lockId}] is already held. Skipping execution.`, {
          lockId,
          expiresAt: lock.expiresAt,
          correlationId,
        });
        return false;
      }

      // Lock is expired — attempt to claim it
      const updated = await prisma.cronLock.updateMany({
        where: { id: lockId, lockedAt: lock.lockedAt }, // optimistic concurrency check
        data: { lockedAt: now, expiresAt },
      });

      if (updated.count === 0) {
        // Another process claimed the expired lock before we could
        logger.info(`${cidStr}Lock [${lockId}] claimed concurrently by another process.`, {
          lockId,
          correlationId,
        });
        return false;
      }

      logger.info(`${cidStr}Acquired expired lock [${lockId}].`, { lockId, correlationId });
      return true;
    } else {
      // Lock doesn't exist — attempt to create it
      await prisma.cronLock.create({
        data: { id: lockId, lockedAt: now, expiresAt },
      });

      logger.info(`${cidStr}Acquired new lock [${lockId}].`, { lockId, correlationId });
      return true;
    }
  } catch (err: any) {
    if (err.code === "P2002") {
      // Unique constraint violation (another process just created it)
      logger.info(`${cidStr}Lock [${lockId}] claimed concurrently (creation race).`, {
        lockId,
        correlationId,
      });
      return false;
    }
    logger.error(`${cidStr}Error acquiring lock [${lockId}]: ${err.message}`, {
      lockId,
      correlationId,
      error: err.message,
    });
    // Fail-closed: if we can't determine lock state, assume it's locked
    return false;
  }
}

/**
 * Releases a previously acquired lock.
 */
export async function releaseLock(lockId: string, correlationId?: string): Promise<void> {
  const cidStr = correlationId ? `[${correlationId}] ` : "";
  try {
    await prisma.cronLock.delete({ where: { id: lockId } });
    logger.info(`${cidStr}Released lock [${lockId}].`, { lockId, correlationId });
  } catch (err: any) {
    // If P2025 (Record to delete does not exist), ignore it
    if (err.code !== "P2025") {
      logger.error(`${cidStr}Error releasing lock [${lockId}]: ${err.message}`, {
        lockId,
        correlationId,
        error: err.message,
      });
    }
  }
}
