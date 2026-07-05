-- Create CronLock table for distributed locking
CREATE TABLE "CronLock" (
    "id" TEXT NOT NULL,
    "lockedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CronLock_pkey" PRIMARY KEY ("id")
);
