-- ============================================================
-- Run this in Supabase SQL Editor
-- Adds creator portal + subscription verification columns
-- ============================================================

-- Step 1: Add creator portal credentials
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS creator_portal_id TEXT,
  ADD COLUMN IF NOT EXISTS creator_portal_password TEXT;

-- Step 2: Add subscription status (drop constraint first if it exists, then re-add cleanly)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free';

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS subscription_pending_plan TEXT;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS subscription_reject_reason TEXT;

-- Step 3: Update existing rows so they have 'free' status
UPDATE users SET subscription_status = 'free' WHERE subscription_status IS NULL;

-- Step 4: Index for portal login lookups
CREATE INDEX IF NOT EXISTS idx_users_creator_portal_id ON users(creator_portal_id);
