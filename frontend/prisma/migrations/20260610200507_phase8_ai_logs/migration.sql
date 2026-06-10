-- CreateEnum
CREATE TYPE "AiFeature" AS ENUM ('CHAT', 'WORKOUT', 'NUTRITION', 'PROGRESS');

-- AlterTable
ALTER TABLE "MembershipPlan" ADD COLUMN     "description" TEXT,
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "features" TEXT[];

-- AlterTable
ALTER TABLE "TrainerProfile" ADD COLUMN     "publicPhotoUrl" TEXT,
ADD COLUMN     "showOnWebsite" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "AiLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feature" "AiFeature" NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'claude-sonnet-4-20250514',
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiLog_tenantId_createdAt_idx" ON "AiLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "AiLog_userId_createdAt_idx" ON "AiLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AiLog_tenantId_feature_idx" ON "AiLog"("tenantId", "feature");
