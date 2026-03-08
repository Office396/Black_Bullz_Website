-- Create page_modifiers table for storing home page customization data
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS page_modifiers (
  page TEXT PRIMARY KEY,
  carousel JSONB DEFAULT '[]'::jsonb,
  trending_games JSONB DEFAULT '[]'::jsonb,
  game_of_the_day JSONB,
  collections JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index for faster queries
CREATE INDEX IF NOT EXISTS idx_page_modifiers_page ON page_modifiers(page);

-- Insert default home page data
INSERT INTO page_modifiers (page, carousel, trending_games, game_of_the_day, collections)
VALUES ('home', '[]'::jsonb, '[]'::jsonb, NULL, '[]'::jsonb)
ON CONFLICT (page) DO NOTHING;

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_page_modifiers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function
DROP TRIGGER IF EXISTS update_page_modifiers_timestamp ON page_modifiers;
CREATE TRIGGER update_page_modifiers_timestamp
BEFORE UPDATE ON page_modifiers
FOR EACH ROW
EXECUTE FUNCTION update_page_modifiers_updated_at();

-- Grant necessary permissions (adjust based on your Supabase setup)
-- ALTER TABLE page_modifiers ENABLE ROW LEVEL SECURITY;
