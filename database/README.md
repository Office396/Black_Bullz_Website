# Database Setup for Page Modifier

## Setup Instructions

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Run the Migration**
   - Copy the contents of `page_modifiers_table.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the SQL

3. **Verify Table Creation**
   - Go to the "Table Editor" in Supabase
   - You should see a new table called `page_modifiers`

## Table Structure

The `page_modifiers` table stores all customization data for different pages:

- `page` (TEXT, PRIMARY KEY): The page identifier (e.g., 'home')
- `carousel` (JSONB): Array of carousel items with game IDs, images, and logos
- `trending_games` (JSONB): Array of trending game IDs with order
- `game_of_the_day` (JSONB): Single game with trailer URL
- `collections` (JSONB): Array of game collections/series
- `created_at` (TIMESTAMP): When the record was created
- `updated_at` (TIMESTAMP): When the record was last updated

## Data Format Examples

### Carousel Item
```json
{
  "id": "1234567890",
  "gameId": 1,
  "landscapeImage": "https://example.com/landscape.jpg",
  "logoImage": "https://example.com/logo.png",
  "order": 0
}
```

### Trending Game
```json
{
  "gameId": 1,
  "order": 0
}
```

### Game of the Day
```json
{
  "gameId": 1,
  "trailerUrl": "https://www.youtube.com/embed/..."
}
```

### Collection
```json
{
  "id": "1234567890",
  "name": "Grand Theft Auto Series",
  "gameIds": [1, 2, 3],
  "order": 0
}
```

## Troubleshooting

If you encounter any errors:

1. Make sure you have the necessary permissions in Supabase
2. Check that the table doesn't already exist
3. Verify your Supabase connection in `lib/supabase.ts`
