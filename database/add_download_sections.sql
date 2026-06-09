-- Add column for Installable download section (Pre-installed uses existing cloud_downloads column)
ALTER TABLE items ADD COLUMN IF NOT EXISTS installable_downloads JSONB DEFAULT '[]';

-- Enable RLS if needed (optional, depends on your setup)
-- ALTER TABLE items ENABLE ROW LEVEL SECURITY;
