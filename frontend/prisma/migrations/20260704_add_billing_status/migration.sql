-- Phase 1 Migration: Add billingStatus to Tenant
-- Backward-compatible: DEFAULT 'ACTIVE' means no existing rows are invalidated
-- Rollback: ALTER TABLE "Tenant" DROP COLUMN "billingStatus";

ALTER TABLE "Tenant" ADD COLUMN "billingStatus" TEXT NOT NULL DEFAULT 'ACTIVE';
