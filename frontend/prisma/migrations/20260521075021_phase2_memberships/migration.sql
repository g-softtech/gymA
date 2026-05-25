-- Phase 2: Add Subscription system and SubscriptionStatus enum

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'CANCELLED');

-- DropForeignKey (re-add with correct cascade rules)
ALTER TABLE "MemberProfile" DROP CONSTRAINT "MemberProfile_userId_fkey";
ALTER TABLE "MembershipPlan" DROP CONSTRAINT "MembershipPlan_tenantId_fkey";
ALTER TABLE "TrainerProfile" DROP CONSTRAINT "TrainerProfile_userId_fkey";
ALTER TABLE "User" DROP CONSTRAINT "User_tenantId_fkey";
ALTER TABLE "WorkoutPlan" DROP CONSTRAINT "WorkoutPlan_memberId_fkey";

-- Make User.tenantId nullable (social/OAuth users may not belong to a tenant yet)
ALTER TABLE "User" ALTER COLUMN "tenantId" DROP NOT NULL;

-- CreateTable Subscription
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "paymentGatewayId" TEXT,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MemberProfile" ADD CONSTRAINT "MemberProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrainerProfile" ADD CONSTRAINT "TrainerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MembershipPlan" ADD CONSTRAINT "MembershipPlan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkoutPlan" ADD CONSTRAINT "WorkoutPlan_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "MemberProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "MemberProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "MembershipPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
