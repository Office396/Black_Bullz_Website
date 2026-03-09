# Add Updated Date Column Migration

This migration adds automatic timestamp tracking for when games are added or edited.

## What This Does

1. Adds `updated_date` column to the `items` table
2. Sets initial values for existing games (copies from `upload_date`)
3. Creates an index for faster sorting
4. Creates a database trigger to automatically update the timestamp on edits

## How to Apply

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the contents of `add_updated_date_column.sql`
5. Click "Run" to execute the migration

### Option 2: Supabase CLI

```bash
supabase db push
```

Or manually:

```bash
psql -h your-db-host -U postgres -d your-database -f database/add_updated_date_column.sql
```

## What Happens After Migration

### For New Games
- When you add a new game, both `upload_date` and `updated_date` are automatically set to the current timestamp

### For Edited Games
- When you edit any game, `updated_date` is automatically updated to the current timestamp
- The `upload_date` remains unchanged (preserves when the game was first added)

### Recent Updates Page
The Recent Updates page now shows games sorted by:
1. `updated_date` (if available - most recently edited)
2. `upload_date` (when first added)
3. `release_date` (fallback)
4. `game.id` (final tiebreaker - higher ID = newer)

## Verification

After applying the migration, you can verify it worked:

```sql
-- Check if column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'items' AND column_name = 'updated_date';

-- Check if trigger exists
SELECT trigger_name 
FROM information_schema.triggers 
WHERE event_object_table = 'items' AND trigger_name = 'update_items_updated_date';

-- View some sample data
SELECT id, title, upload_date, updated_date 
FROM items 
ORDER BY updated_date DESC 
LIMIT 10;
```

## Rollback (If Needed)

If you need to remove this feature:

```sql
-- Drop the trigger
DROP TRIGGER IF EXISTS update_items_updated_date ON items;
DROP FUNCTION IF EXISTS update_updated_date_column();

-- Drop the index
DROP INDEX IF EXISTS idx_items_updated_date;

-- Remove the column (WARNING: This deletes the data)
ALTER TABLE items DROP COLUMN IF EXISTS updated_date;
```

## Notes

- The migration is safe to run multiple times (uses `IF NOT EXISTS`)
- Existing games will have `updated_date` set to their `upload_date` initially
- The database trigger provides automatic updates even if the application code fails
- Both the application code AND the database trigger update the timestamp (double protection)
