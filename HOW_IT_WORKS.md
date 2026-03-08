# How the Admin Page Modifier Works

## Visual Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  1. OPEN ADMIN PANEL                                        │
│  Go to /admin → Click "Modifier" tab                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  2. SETUP CHECK (Automatic)                                 │
│  ✅ Green: Database ready - proceed!                        │
│  ❌ Red: Run migration SQL first                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  3. MAKE CHANGES                                            │
│  • Add items                                                │
│  • Edit items (click pencil icon)                          │
│  • Remove items (click trash icon)                         │
│  • Reorder items (up/down arrows)                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  4. UNSAVED CHANGES INDICATOR                               │
│  🟠 Orange banner appears: "You have unsaved changes!"      │
│  🟠 Save button turns orange and pulses                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  5. SAVE CHANGES                                            │
│  Click orange "Save Changes (Unsaved!)" button              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  6. CONFIRMATION                                            │
│  ✅ Success: "Changes saved successfully!"                  │
│  ⚠️ Warning: Check database setup                           │
│  ❌ Error: Check console for details                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  7. VERIFY                                                  │
│  Refresh page - changes should persist                      │
│  Check website homepage - see your changes live             │
└─────────────────────────────────────────────────────────────┘
```

## State Management Flow

### Before Saving (Local State)
```
User Action → React State Update → UI Updates Immediately
     ↓
Changes stored in browser memory only
     ↓
Orange warning appears
     ↓
NOT saved to database yet
```

### After Saving (Persistent State)
```
Click Save Button → API Request → Supabase Database
     ↓
Data persisted permanently
     ↓
Success message shown
     ↓
Orange warning disappears
     ↓
Changes visible to all users
```

## Component Architecture

```
AdminPageModifier (Main Component)
├── AdminSetupChecker (Database status)
├── Unsaved Changes Banner (Warning)
├── Page Selector Dropdown
├── Save All Changes Button
└── Tabs
    ├── CarouselEditor
    │   ├── Add New Form
    │   ├── Current Items List
    │   └── Edit Mode (inline)
    ├── TrendingGamesEditor
    │   ├── Add Game Form
    │   └── Current Games List
    ├── GameOfTheDayEditor
    │   ├── Current GOTD Display
    │   └── Set/Update Form
    └── CollectionsEditor
        ├── Create Collection Form
        └── Collections List
            ├── Add Games Form
            └── Games Grid
```

## Data Flow

### Loading Data (On Mount)
```
Component Mounts
    ↓
Fetch from API
    ↓
API queries Supabase
    ↓
If empty, load defaults:
    • Carousel: First 8 games
    • Trending: Games marked as trending
    • GOTD: Empty
    • Collections: Empty
    ↓
Set React State
    ↓
Render UI
```

### Saving Data (On Save Click)
```
User clicks Save
    ↓
Collect all state data:
    • carouselItems
    • trendingGames
    • gameOfTheDay
    • collections
    ↓
Send 4 parallel POST requests
    ↓
Each API route:
    1. Check if record exists
    2. Update or Insert
    3. Return success/error
    ↓
Show result to user
    ↓
Clear unsaved changes flag
```

## Search Functionality

### Game Selection Dropdowns
```
User opens dropdown
    ↓
Search bar appears at top
    ↓
User types search term
    ↓
useMemo filters games:
    • By title (case-insensitive)
    • By category (case-insensitive)
    ↓
Filtered results display
    ↓
User selects game
```

## Edit Mode (Carousel)

### View Mode
```
Display item with:
    • Preview image
    • Game title
    • Order number
    • Action buttons
```

### Edit Mode (Click pencil icon)
```
Replace display with:
    • Game selector dropdown
    • Landscape image input
    • Logo image input
    • Save/Cancel buttons
    ↓
User makes changes
    ↓
Click Save:
    • Update item in array
    • Exit edit mode
    • Show in view mode
    ↓
Click Cancel:
    • Discard changes
    • Exit edit mode
```

## Key Features

### Real-time Updates
- Changes appear immediately in UI
- No page refresh needed
- Smooth transitions

### Validation
- Required fields checked
- Duplicate prevention
- Confirmation dialogs

### Error Handling
- Setup checker
- API error messages
- Console logging
- User-friendly alerts

### User Experience
- Visual feedback (colors, animations)
- Clear status indicators
- Helpful error messages
- Undo capability (before save)

## Database Schema

```sql
page_modifiers
├── page (TEXT, PRIMARY KEY)
├── carousel (JSONB)
│   └── [{id, gameId, landscapeImage, logoImage, order}]
├── trending_games (JSONB)
│   └── [{gameId, order}]
├── game_of_the_day (JSONB)
│   └── {gameId, trailerUrl}
├── collections (JSONB)
│   └── [{id, name, gameIds[], order}]
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

## API Routes

### GET Endpoints
- Return current data from database
- Return empty arrays/null if no data
- Never throw errors (graceful fallback)

### POST Endpoints
- Accept data in request body
- Check if record exists
- Update existing or insert new
- Return success/error status

## Best Practices

### When Making Changes
1. Make all your edits first
2. Review changes in UI
3. Click Save once at the end
4. Wait for confirmation
5. Verify by refreshing

### When Troubleshooting
1. Check setup status first
2. Look at browser console
3. Verify database table exists
4. Test with simple change
5. Check API responses

### When Adding Many Items
1. Add items one by one
2. Don't save after each item
3. Save once when done
4. Reduces API calls
5. Faster workflow
