# Fix 500 Error - Database Table Missing

## The Problem

Your console shows:
```
POST http://localhost:3000/api/admin/carousel 500 (Internal Server Error)
POST http://localhost:3000/api/admin/trending-games 500 (Internal Server Error)
POST http://localhost:3000/api/admin/game-of-the-day 500 (Internal Server Error)
POST http://localhost:3000/api/admin/collections 500 (Internal Server Error)
```

This means the `page_modifiers` table doesn't exist in your Supabase database.

## The Solution

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com
2. Select your project
3. Click on "SQL Editor" in the left sidebar

### Step 2: Run the Migration SQL

Copy this ENTIRE SQL script and paste it into the SQL Editor:

```sql
-- Create page_modifiers table for storing home page customization data
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
```

### Step 3: Click "Run"
- Click the "Run" button in the SQL Editor
- You should see: "Success. No rows returned" or similar success message

### Step 4: Verify Table Was Created
1. Go to "Table Editor" in Supabase
2. Look for a table called `page_modifiers`
3. You should see one row with `page = 'home'`

### Step 5: Test in Admin Panel
1. Go back to your admin panel
2. Refresh the page (F5)
3. Click "Check Again" button in the Setup Status section
4. You should now see: ✅ "Database is set up correctly!"

### Step 6: Try Again
1. Remove an item
2. Click "Save Changes"
3. Should now work without 500 errors!

## If You Still Get Errors

### Check Supabase Connection

Make sure you have a `.env.local` file with:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Check lib/supabase.ts

Make sure this file exists and looks like:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Check Server Terminal

Look at your terminal where Next.js is running. You should see detailed error messages there that will tell you exactly what's wrong.

## Common Errors

### "relation 'page_modifiers' does not exist"
- **Solution**: Run the SQL migration above

### "permission denied for table page_modifiers"
- **Solution**: Disable Row Level Security (RLS) on the table:
  ```sql
  ALTER TABLE page_modifiers DISABLE ROW LEVEL SECURITY;
  ```

### "invalid input syntax for type json"
- **Solution**: Make sure you're using JSONB columns, not JSON

## After Running Migration

The setup checker will now show the actual error message if something is wrong, making it easier to debug.

Refresh your admin panel and click "Check Again" to see the updated status!
