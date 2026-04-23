-- Create comment_reactions table
CREATE TABLE IF NOT EXISTS public.comment_reactions (
  id SERIAL PRIMARY KEY,
  item_id INTEGER NOT NULL,
  comment_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  reaction TEXT NOT NULL CHECK (reaction IN ('like', 'dislike')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(item_id, comment_id, user_id)
);

-- Create function to increment comment likes
CREATE OR REPLACE FUNCTION public.increment_comment_likes(p_comment_id INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE public.comments SET likes = COALESCE(likes, 0) + 1 WHERE id = p_comment_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to increment comment dislikes  
CREATE OR REPLACE FUNCTION public.increment_comment_dislikes(p_comment_id INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE public.comments SET dislikes = COALESCE(dislikes, 0) + 1 WHERE id = p_comment_id;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can insert reactions" ON public.comment_reactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view reactions" ON public.comment_reactions FOR SELECT USING (true);