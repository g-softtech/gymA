-- AlterTable
ALTER TABLE "TenantSettings" ADD COLUMN     "dnsVerifiedAt" TIMESTAMP(3);
ALTER TABLE "TenantSettings" ADD COLUMN     "verificationToken" TEXT;
