# Admin Page Modifier - Setup Guide

## Overview
The Admin Page Modifier allows you to customize the home page content including:
- Hero Carousel (with landscape images and logos)
- Trending Games section
- Game of the Day (with trailer)
- Collections/Series

## Setup Steps

### 1. Database Setup

1. Open your Supabase dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `database/page_modifiers_table.sql`
4. Click "Run" to create the table

### 2. Verify Installation

1. Go to your admin panel at `/admin`
2. Click on the "Modifier" tab
3. Select "Home Page" from the dropdown
4. You should see four sub-tabs: Carousel, Trending Games, Game of the Day, Collections

### 3. Initial Data Load

When you first open the Modifier tab:
- **Carousel**: Will automatically load the first 8 games from your database (matching the current behavior)
- **Trending Games**: Will automatically load all games marked as "trending" in your database
- **Game of the Day**: Will be empty (you need to set it)
- **Collections**: Will be empty (you need to create them)

## How to Use

### Hero Carousel

1. Go to the "Carousel" tab
2. You'll see existing carousel items (initially the first 8 games)
3. To add a new item:
   - Select a game from the dropdown
   - Enter a landscape image URL (recommended: 1920x1080px)
   - Optionally add a logo image URL from https://www.steamgriddb.com/
   - Click "Add to Carousel"
4. To edit an existing item:
   - Click the "Edit" button (pencil icon)
   - Modify the game, landscape image, or logo
   - Click "Save" or "Cancel"
5. To reorder items:
   - Use the up/down arrow buttons
6. To remove an item:
   - Click the trash icon
7. Click "Save All Changes" at the top to persist your changes

### Trending Games

1. Go to the "Trending Games" tab
2. You'll see games currently marked as trending
3. To add a game:
   - Select from the dropdown
   - Click "Add"
4. To reorder:
   - Use up/down arrows
5. To remove:
   - Click trash icon
6. Click "Save All Changes" to persist

### Game of the Day

1. Go to the "Game of the Day" tab
2. Select a game from the dropdown
3. Enter a trailer URL (YouTube embed or direct video link)
   - Example: `https://www.youtube.com/embed/VIDEO_ID`
4. Click "Set Game of the Day"
5. The trailer will play in the transparent section on the home page
6. Click "Save All Changes" to persist

### Collections

1. Go to the "Collections" tab
2. To create a new collection:
   - Enter a name (e.g., "Grand Theft Auto Series")
   - Click "Create"
3. To add games to a collection:
   - Select a game from the dropdown
   - Click the "+" button
4. Games will display in a grid with the existing animation
5. To remove a game:
   - Hover over the game card
   - Click the X button
6. To delete a collection:
   - Click the trash icon next to the collection name
7. Click "Save All Changes" to persist

## Important Notes

### Getting Game Logos
- Visit https://www.steamgriddb.com/
- Search for your game
- Download the logo (transparent PNG recommended)
- Upload to your hosting service
- Use the URL in the carousel editor

### Image Recommendations
- **Carousel Landscape**: 1920x1080px (16:9 ratio)
- **Logos**: Transparent PNG, any size (will be auto-scaled)
- **Trailer URLs**: Use YouTube embed format for best compatibility

### Data Persistence
- All changes are saved to the Supabase database
- Changes take effect immediately on the website after saving
- The "Save All Changes" button saves all four sections at once

### Troubleshooting

**Problem**: "No carousel items yet" message appears
- **Solution**: Make sure you have games in your database. The system will auto-load the first 8 games.

**Problem**: Changes don't appear on the website
- **Solution**: Make sure you clicked "Save All Changes" button at the top of the page.

**Problem**: API errors when saving
- **Solution**: Check that you ran the database migration SQL script in Supabase.

**Problem**: Images don't load
- **Solution**: Verify the image URLs are publicly accessible and use HTTPS.

## API Endpoints

The following API endpoints are available:

- `GET /api/admin/carousel` - Get carousel items
- `POST /api/admin/carousel` - Update carousel items
- `GET /api/admin/trending-games` - Get trending games
- `POST /api/admin/trending-games` - Update trending games
- `GET /api/admin/game-of-the-day` - Get game of the day
- `POST /api/admin/game-of-the-day` - Update game of the day
- `GET /api/admin/collections` - Get collections
- `POST /api/admin/collections` - Update collections

## Files Created

### API Routes
- `app/api/admin/carousel/route.ts`
- `app/api/admin/trending-games/route.ts`
- `app/api/admin/game-of-the-day/route.ts`
- `app/api/admin/collections/route.ts`

### Components
- `components/admin-page-modifier.tsx` - Main modifier component
- `components/admin-carousel-editor.tsx` - Carousel manager with edit capability
- `components/admin-trending-games-editor.tsx` - Trending games manager
- `components/admin-gotd-editor.tsx` - Game of the day manager
- `components/admin-collections-editor.tsx` - Collections manager

### Database
- `lib/server/page-modifier-store.ts` - Data access layer
- `database/page_modifiers_table.sql` - Database migration
- `database/README.md` - Database setup instructions

## Next Steps

1. Run the database migration
2. Open the admin panel
3. Navigate to the Modifier tab
4. Start customizing your home page!

The system will automatically load existing hardcoded data on first use, making it easy to transition from hardcoded to dynamic content management.
