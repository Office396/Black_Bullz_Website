# Troubleshooting Guide - Admin Page Modifier

## Issue: Items Don't Remove or Changes Don't Save

### Root Cause
The database table `page_modifiers` hasn't been created yet in Supabase.

### Solution

#### Step 1: Run Database Migration
1. Open your Supabase dashboard
2. Navigate to **SQL Editor**
3. Open the file `database/page_modifiers_table.sql` in your code editor
4. Copy the entire contents
5. Paste into Supabase SQL Editor
6. Click **"Run"** button
7. You should see: "Success. No rows returned"

#### Step 2: Verify Setup
1. Go back to your admin panel
2. Click on the **"Modifier"** tab
3. You should see a green checkmark: "✅ Database is set up correctly!"
4. If you see a red X, click "Check Again" button

#### Step 3: Test Functionality
1. Try removing an item from any section
2. You'll see an orange warning banner: "You have unsaved changes!"
3. Click the orange **"Save Changes (Unsaved!)"** button
4. You should see: "✅ Changes saved successfully!"
5. Refresh the page - your changes should persist

## Visual Indicators

### Unsaved Changes
- **Orange warning banner** appears at the top when you make changes
- **Save button turns orange** and pulses
- Button text changes to "Save Changes (Unsaved!)"

### Saved Successfully
- Alert message: "✅ Changes saved successfully!"
- Orange indicators disappear
- Button returns to purple

### Save Failed
- Alert message with specific error details
- Check browser console (F12) for more information

## Common Issues

### Issue 1: "Database table not found"
**Cause**: Migration SQL hasn't been run
**Solution**: Follow Step 1 above

### Issue 2: "Error connecting to database"
**Cause**: Supabase configuration issue
**Solution**: 
1. Check `lib/supabase.ts` file exists
2. Verify your Supabase URL and API key in `.env.local`
3. Make sure Supabase project is active

### Issue 3: Changes appear but don't persist after refresh
**Cause**: You didn't click "Save All Changes" button
**Solution**: 
1. Make your changes
2. Wait for orange warning banner
3. Click the orange "Save Changes (Unsaved!)" button
4. Wait for success message

### Issue 4: Some items save but others don't
**Cause**: Partial database setup or connection issues
**Solution**:
1. Check browser console (F12) for specific errors
2. Re-run the database migration SQL
3. Click "Check Again" in the setup checker

### Issue 5: Can't find games in dropdown
**Cause**: No search term entered or no matching games
**Solution**:
1. Click on the dropdown
2. Use the search bar at the top
3. Type part of the game name
4. Results filter in real-time

## How Changes Work

### Local State (Temporary)
When you add/remove/edit items:
- Changes are stored in browser memory (React state)
- You can see them immediately
- They are NOT saved to database yet
- Refreshing the page will lose these changes

### Saved State (Permanent)
After clicking "Save All Changes":
- Data is sent to API endpoints
- API saves to Supabase database
- Changes persist across page refreshes
- Other admins can see the changes

## Testing the Setup

### Quick Test
1. Go to Modifier tab
2. Add a new carousel item
3. See orange warning banner appear
4. Click "Save Changes (Unsaved!)"
5. Refresh the page
6. Item should still be there

### Full Test
1. **Carousel**: Add, edit, remove, reorder items
2. **Trending**: Add and remove games
3. **Game of the Day**: Set a game with trailer
4. **Collections**: Create collection, add games
5. Click "Save All Changes"
6. Refresh page
7. All changes should persist

## Database Structure

The `page_modifiers` table has these columns:
- `page` (TEXT) - Always "home" for now
- `carousel` (JSONB) - Array of carousel items
- `trending_games` (JSONB) - Array of trending game IDs
- `game_of_the_day` (JSONB) - Single game object
- `collections` (JSONB) - Array of collections
- `created_at` (TIMESTAMP) - Auto-generated
- `updated_at` (TIMESTAMP) - Auto-updated

## API Endpoints

All endpoints support GET and POST:
- `/api/admin/carousel`
- `/api/admin/trending-games`
- `/api/admin/game-of-the-day`
- `/api/admin/collections`

## Browser Console Debugging

Press F12 to open browser console and look for:

### Success Messages
```
Successfully updated carousel
Successfully updated trending games
```

### Error Messages
```
Error updating carousel: [details]
Error fetching home page data: [details]
```

### Network Tab
1. Open Network tab in browser console
2. Make a change and click Save
3. Look for POST requests to `/api/admin/*`
4. Check response status (should be 200)
5. Check response body for success/error

## Still Having Issues?

1. **Check Supabase Dashboard**
   - Go to Table Editor
   - Look for `page_modifiers` table
   - Verify it exists and has data

2. **Check Browser Console**
   - Press F12
   - Look for red error messages
   - Copy error details

3. **Check Server Logs**
   - Look at your terminal where Next.js is running
   - Check for API errors

4. **Verify Files Exist**
   - `lib/server/page-modifier-store.ts`
   - `app/api/admin/carousel/route.ts`
   - `app/api/admin/trending-games/route.ts`
   - `app/api/admin/game-of-the-day/route.ts`
   - `app/api/admin/collections/route.ts`

## Need More Help?

See these files for detailed information:
- `QUICK_START.md` - Basic setup guide
- `ADMIN_MODIFIER_SETUP.md` - Complete documentation
- `database/README.md` - Database setup details
