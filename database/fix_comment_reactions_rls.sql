-- Drop existing policies and RLS for comment_reactions
DROP POLICY IF EXISTS "Users can insert reactions" ON public.comment_reactions;
DROP POLICY IF EXISTS "Anyone can view reactions" ON public.comment_reactions;
ALTER TABLE public.comment_reactions DISABLE ROW LEVEL SECURITY;

-- Create a simpler policy that allows all operations (since auth is handled in API routes)
CREATE POLICY "Allow all" ON public.comment_reactions FOR ALL USING (true) WITH CHECK (true);