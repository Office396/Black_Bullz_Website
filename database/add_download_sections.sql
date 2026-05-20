-- Add columns for Pre-installed and Installable download sections
ALTER TABLE items ADD COLUMN IF NOT EXISTS pre_installed_downloads JSONB DEFAULT '[]';
ALTER TABLE items ADD COLUMN IF NOT EXISTS installable_downloads JSONB DEFAULT '[]';

-- Enable RLS if needed (optional, depends on your setup)
-- ALTER TABLE items ENABLE ROW LEVEL SECURITY;