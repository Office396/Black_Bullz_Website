-- Create function to decrement comment likes
CREATE OR REPLACE FUNCTION public.decrement_comment_likes(p_comment_id INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE public.comments SET likes = GREATEST(0, COALESCE(likes, 0) - 1) WHERE id = p_comment_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to decrement comment dislikes
CREATE OR REPLACE FUNCTION public.decrement_comment_dislikes(p_comment_id INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE public.comments SET dislikes = GREATEST(0, COALESCE(dislikes, 0) - 1) WHERE id = p_comment_id;
END;
$$ LANGUAGE plpgsql;