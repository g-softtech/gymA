-- CreateEnum
CREATE TYPE "DietGoal" AS ENUM ('WEIGHT_LOSS', 'MUSCLE_GAIN', 'MAINTENANCE', 'ENDURANCE', 'GENERAL_HEALTH');

-- CreateTable
CREATE TABLE "MealPlan" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "goal" "DietGoal" NOT NULL DEFAULT 'GENERAL_HEALTH',
    "totalCalories" INTEGER NOT NULL,
    "protein" DOUBLE PRECISION NOT NULL,
    "carbs" DOUBLE PRECISION NOT NULL,
    "fats" DOUBLE PRECISION NOT NULL,
    "meals" JSONB NOT NULL,
    "isAiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodLog" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mealType" TEXT NOT NULL,
    "foodName" TEXT NOT NULL,
    "calories" INTEGER NOT NULL,
    "protein" DOUBLE PRECISION NOT NULL,
    "carbs" DOUBLE PRECISION NOT NULL,
    "fats" DOUBLE PRECISION NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'serving',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MealPlan_memberId_idx" ON "MealPlan"("memberId");

-- CreateIndex
CREATE INDEX "FoodLog_memberId_date_idx" ON "FoodLog"("memberId", "date");

-- AddForeignKey
ALTER TABLE "MealPlan" ADD CONSTRAINT "MealPlan_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "MemberProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodLog" ADD CONSTRAINT "FoodLog_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "MemberProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
