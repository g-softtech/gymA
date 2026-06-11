-- Migration: gemini_model_default
-- Updates the default value for AiLog.model column from
-- 'claude-sonnet-4-20250514' to 'gemini-2.0-flash'
-- following the Anthropic → Google Gemini provider migration.

ALTER TABLE "AiLog" ALTER COLUMN "model" SET DEFAULT 'gemini-2.0-flash';
