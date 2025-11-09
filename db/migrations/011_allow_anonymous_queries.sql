-- Migration 011: Allow anonymous queries by making user_id nullable
-- Remove NOT NULL constraint from user_id in queries table to support anonymous usage

-- Make user_id nullable in queries table
ALTER TABLE queries ALTER COLUMN user_id DROP NOT NULL;

-- Add comment explaining anonymous queries
COMMENT ON COLUMN queries.user_id IS 'User who created the query. NULL for anonymous queries when authentication is disabled.';
