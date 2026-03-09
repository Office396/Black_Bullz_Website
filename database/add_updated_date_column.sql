-- Add updated_date column to items table
-- This column will automatically track when a game is edited

-- Add the column (if it doesn't exist)
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS updated_date TIMESTAMP WITH TIME ZONE;

-- Set initial value for existing records to match their upload_date
-- Cast the text upload_date to timestamp
UPDATE items 
SET updated_date = upload_date::TIMESTAMP WITH TIME ZONE
WHERE updated_date IS NULL AND upload_date IS NOT NULL;

-- For records without upload_date, set to current time
UPDATE items 
SET updated_date = NOW()
WHERE updated_date IS NULL;

-- Create an index on updated_date for faster sorting
CREATE INDEX IF NOT EXISTS idx_items_updated_date ON items(updated_date DESC);

-- Optional: Create a trigger to automatically update the timestamp (PostgreSQL)
-- This is an alternative to doing it in the application code
CREATE OR REPLACE FUNCTION update_updated_date_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_date = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if it exists and recreate it
DROP TRIGGER IF EXISTS update_items_updated_date ON items;

CREATE TRIGGER update_items_updated_date
    BEFORE UPDATE ON items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_date_column();

-- Note: The trigger will automatically set updated_date on every UPDATE
-- The application code also sets it, so you have double protection
