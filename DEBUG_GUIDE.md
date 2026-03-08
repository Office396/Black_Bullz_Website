# Debug Guide - Finding Why Changes Don't Work

## Step-by-Step Debugging Process

### Step 1: Open Debug Panel
1. Go to Admin Panel → Modifier tab
2. You'll see a new "Debug Panel" section
3. Click on it to expand
4. You'll see:
   - Count of items in each section
   - Full JSON of current state
   - "Log State to Console" button

### Step 2: Test Remove Functionality

#### A. Remove an Item
1. Go to Carousel tab
2. Click the trash icon on any item
3. Confirm the deletion
4. **Watch the Debug Panel** - the count should decrease immediately

#### B. Check Console Logs
1. Press F12 to open browser console
2. You should see:
   ```
   Removing item: [item-id]
   Items before: [number]
   Items after: [number-1]
   ```

#### C. Check Orange Warning
- Orange "You have unsaved changes!" banner should appear
- Save button should turn orange and pulse

### Step 3: Test Save Functionality

#### A. Click Save Button
1. Click the orange "Save Changes (Unsaved!)" button
2. Watch the console for logs

#### B. Expected Console Output
```
=== SAVING CHANGES ===
Carousel items: [number]
Trending games: [number]
Game of the day: [object or null]
Collections: [number]

=== CAROUSEL API POST ===
Received items: [number]
Items data: [JSON array]

=== UPDATE CAROUSEL STORE ===
Items to save: [number]
Existing record: Found (or Not found)
Updating existing record... (or Inserting new record...)
✅ Carousel updated successfully

API Results: [array of results]
API Responses: [array of responses]
✅ All changes saved successfully
```

### Step 4: Verify Database

#### A. Check Supabase Table
1. Open Supabase dashboard
2. Go to Table Editor
3. Find `page_modifiers` table
4. Look for row where `page = 'home'`
5. Check the `carousel` column - should be JSONB array

#### B. Check Data Matches
1. Click "Log State to Console" in Debug Panel
2. Copy the carousel array from console
3. Compare with database `carousel` column
4. They should match after saving

### Step 5: Test Persistence

#### A. Refresh Test
1. Make a change (remove an item)
2. Save changes
3. Wait for success message
4. Refresh the page (F5)
5. Check if the item is still removed

#### B. If Item Comes Back
This means the save didn't work. Check:
- Console errors during save
- Database table has the data
- API responses show success

## Common Issues & Solutions

### Issue 1: Item Disappears but Comes Back After Refresh

**Diagnosis:**
- Debug panel shows correct count after removal
- Orange warning appears
- But after save and refresh, item is back

**Cause:** Save is not actually writing to database

**Check:**
1. Console logs during save - look for errors
2. Supabase table - check if data changed
3. API response - should show `success: true`

**Solution:**
```bash
# Check if table exists
# In Supabase SQL Editor:
SELECT * FROM page_modifiers WHERE page = 'home';

# If no results, run migration again
# Copy from database/page_modifiers_table.sql
```

### Issue 2: Orange Warning Doesn't Appear

**Diagnosis:**
- Remove item
- Item disappears from list
- No orange warning

**Cause:** onChange callback not triggering

**Check Debug Panel:**
- Does the count decrease?
- If yes: onChange is working
- If no: React state not updating

**Solution:** Check browser console for React errors

### Issue 3: Save Button Stays Purple

**Diagnosis:**
- Make changes
- Debug panel shows changes
- Save button doesn't turn orange

**Cause:** `hasUnsavedChanges` state not updating

**Check Console:**
```javascript
// Should see this when you make changes:
Removing item: [id]
Items before: [number]
Items after: [number]
```

### Issue 4: Success Message but No Persistence

**Diagnosis:**
- Save shows "✅ Changes saved successfully!"
- Refresh page
- Changes are gone

**Cause:** Database write succeeded but read is failing

**Check:**
1. Supabase table has the data
2. GET API returns the data
3. Component loads the data on mount

**Debug:**
```javascript
// In console after refresh:
// Should see:
Fetching home page data...
Carousel items loaded: [number]
```

### Issue 5: Console Shows Errors

**Common Errors:**

#### "relation 'page_modifiers' does not exist"
- **Cause:** Table not created
- **Solution:** Run migration SQL

#### "null value in column 'page' violates not-null constraint"
- **Cause:** Insert without page value
- **Solution:** Check API route sends `page: 'home'`

#### "duplicate key value violates unique constraint"
- **Cause:** Trying to insert when record exists
- **Solution:** Code should update, not insert (already handled)

#### "permission denied for table page_modifiers"
- **Cause:** Supabase RLS (Row Level Security) blocking
- **Solution:** Disable RLS or add policy

## Advanced Debugging

### Check Network Tab
1. Open browser DevTools (F12)
2. Go to Network tab
3. Make a change and save
4. Look for POST requests to `/api/admin/carousel`
5. Click on the request
6. Check:
   - Request payload (should have your items)
   - Response (should be `{success: true}`)
   - Status code (should be 200)

### Check Server Logs
Look at your terminal where Next.js is running:
```
=== CAROUSEL API POST ===
Received items: 7
Items data: [...]

=== UPDATE CAROUSEL STORE ===
Items to save: 7
Existing record: Found
Updating existing record...
✅ Carousel updated successfully
```

### Manual Database Test
In Supabase SQL Editor:
```sql
-- Check current data
SELECT carousel FROM page_modifiers WHERE page = 'home';

-- Manually update to test
UPDATE page_modifiers 
SET carousel = '[]'::jsonb 
WHERE page = 'home';

-- Refresh admin panel - should show 0 items
```

## Reporting Issues

If still not working, collect this info:

1. **Console Logs:**
   - Copy all logs from making change → saving → refreshing
   
2. **Network Tab:**
   - Screenshot of POST request/response
   
3. **Database:**
   - Screenshot of page_modifiers table row
   
4. **Debug Panel:**
   - Screenshot showing counts before/after
   
5. **Steps to Reproduce:**
   - Exact steps you took
   - What you expected
   - What actually happened

## Quick Test Script

Run this in browser console to test everything:

```javascript
// Test 1: Check if state updates
console.log('=== TEST 1: State Update ===')
// Remove an item manually
// Check debug panel count

// Test 2: Check if save works
console.log('=== TEST 2: Save Function ===')
// Click save button
// Watch console logs

// Test 3: Check if data persists
console.log('=== TEST 3: Persistence ===')
// Refresh page
// Check if changes remain

// Test 4: Check API directly
fetch('/api/admin/carousel')
  .then(r => r.json())
  .then(data => console.log('Current carousel data:', data))
```

## Success Checklist

✅ Debug panel shows correct counts after changes
✅ Orange warning appears when changes made
✅ Console logs show "Removing item" messages
✅ Save button turns orange
✅ Console shows "=== SAVING CHANGES ===" when saving
✅ Console shows "✅ All changes saved successfully"
✅ Success alert appears
✅ Refresh page - changes persist
✅ Debug panel counts match after refresh
✅ Supabase table shows updated data

If all checkmarks pass, the system is working correctly!
