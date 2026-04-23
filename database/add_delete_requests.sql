-- Create delete_requests table for comment deletion approvals
CREATE TABLE IF NOT EXISTS public.delete_requests (
  id SERIAL PRIMARY KEY,
  comment_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Enable RLS
ALTER TABLE public.delete_requests ENABLE ROW LEVEL SECURITY;

-- Create index
CREATE INDEX IF NOT EXISTS idx_delete_requests_status ON public.delete_requests(status);

-- Policy
CREATE POLICY "Allow all access" ON public.delete_requests FOR ALL USING (true) WITH CHECK (true);