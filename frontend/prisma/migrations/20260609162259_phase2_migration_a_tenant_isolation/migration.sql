-- CreateEnum
CREATE TYPE "TenantPlan" AS ENUM ('FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE');

-- AlterTable
ALTER TABLE "FoodLog" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "MealPlan" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "ProgressRecord" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "plan" "TenantPlan" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "trialEndsAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "WorkoutPlan" ADD COLUMN     "tenantId" TEXT;

-- CreateTable
CREATE TABLE "TenantSettings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "accentColor" TEXT,
    "fontFamily" TEXT,
    "darkMode" BOOLEAN NOT NULL DEFAULT false,
    "customDomain" TEXT,
    "subdomain" TEXT,
    "domainVerified" BOOLEAN NOT NULL DEFAULT false,
    "tagline" TEXT,
    "description" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT DEFAULT 'Nigeria',
    "mapEmbedUrl" TEXT,
    "instagramUrl" TEXT,
    "facebookUrl" TEXT,
    "twitterUrl" TEXT,
    "tiktokUrl" TEXT,
    "whatsappNumber" TEXT,
    "youtubeUrl" TEXT,
    "heroData" JSONB,
    "aboutData" JSONB,
    "servicesData" JSONB,
    "galleryData" JSONB,
    "testimonialData" JSONB,
    "contactData" JSONB,
    "featuresData" JSONB,
    "statsData" JSONB,
    "openingHours" JSONB,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "ogImageUrl" TEXT,
    "googleAnalyticsId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "coverImage" TEXT,
    "tags" TEXT[],
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TenantSettings_tenantId_key" ON "TenantSettings"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantSettings_customDomain_key" ON "TenantSettings"("customDomain");

-- CreateIndex
CREATE UNIQUE INDEX "TenantSettings_subdomain_key" ON "TenantSettings"("subdomain");

-- CreateIndex
CREATE INDEX "BlogPost_tenantId_published_publishedAt_idx" ON "BlogPost"("tenantId", "published", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_tenantId_slug_key" ON "BlogPost"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "FoodLog_tenantId_date_idx" ON "FoodLog"("tenantId", "date");

-- CreateIndex
CREATE INDEX "MealPlan_tenantId_createdAt_idx" ON "MealPlan"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "ProgressRecord_tenantId_recordedAt_idx" ON "ProgressRecord"("tenantId", "recordedAt");

-- CreateIndex
CREATE INDEX "Subscription_tenantId_status_idx" ON "Subscription"("tenantId", "status");

-- CreateIndex
CREATE INDEX "WorkoutPlan_tenantId_createdAt_idx" ON "WorkoutPlan"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "TenantSettings" ADD CONSTRAINT "TenantSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
