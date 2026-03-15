-- Add donate_settings column to page_modifiers table
-- Run this in your Supabase SQL Editor

ALTER TABLE page_modifiers
ADD COLUMN IF NOT EXISTS donate_settings JSONB;

-- Insert default donate row (won't overwrite if exists)
INSERT INTO page_modifiers (page, carousel, trending_games, game_of_the_day, collections, donate_settings)
VALUES ('donate', '[]'::jsonb, '[]'::jsonb, NULL, '[]'::jsonb, NULL)
ON CONFLICT (page) DO NOTHING;
