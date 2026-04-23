-- Add missing item_id column to comment_reactions
ALTER TABLE public.comment_reactions ADD COLUMN IF NOT EXISTS item_id INTEGER;

-- Rename reaction column if needed (check if it exists)
-- The column is already named reaction_type, so we need to update the API