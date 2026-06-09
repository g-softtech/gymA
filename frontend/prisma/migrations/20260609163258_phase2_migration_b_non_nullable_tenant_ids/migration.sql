/*
  Warnings:

  - Made the column `tenantId` on table `FoodLog` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `MealPlan` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `ProgressRecord` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Subscription` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `WorkoutPlan` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "FoodLog" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "MealPlan" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "ProgressRecord" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Subscription" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "WorkoutPlan" ALTER COLUMN "tenantId" SET NOT NULL;
