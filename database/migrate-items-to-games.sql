-- ============================================================
-- MIGRATION: Convert old 'items' table to new 'games' table
-- Run this AFTER creating the new schema above
-- ============================================================

-- 1. Rename old table (backup)
ALTER TABLE IF EXISTS items RENAME TO items_backup;

-- 2. Create new games table (already created by schema above)

-- 3. Migrate data from items_backup to games
INSERT INTO games (
  id, title, slug, description, long_description, developer, publisher,
  release_date, repack_date, cover_image, landscape_image, screenshots,
  genres, tags, rating, original_size, repack_size, repacker_name,
  system_requirements, languages, mirrors, installation_notes,
  rar_password, downloads, views, likes, dislikes, trending,
  status, created_at
)
SELECT
  id,
  title,
  LOWER(REPLACE(REPLACE(REPLACE(title, ' ', '-'), ':', ''), '''', '')) as slug,
  COALESCE(description, ''),
  COALESCE(long_description, ''),
  COALESCE(developer, ''),
  COALESCE(publisher, ''),
  release_date,
  COALESCE(upload_date, NOW()::TEXT) as repack_date,
  image as cover_image,
  landscape_image,
  COALESCE(screenshots, '{}'),
  COALESCE(genres, '{}'),
  COALESCE(
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(system_requirements->'tags', '[]'::jsonb))),
    '{}'
  ),
  COALESCE(rating::NUMERIC, 0),
  '',
  COALESCE(size, ''),
  COALESCE(uploader_name, 'Manual') as repacker_name,
  COALESCE(system_requirements, '{"minimum":{},"recommended":{}}'),
  'English',
  COALESCE(cloud_downloads, '[]'),
  COALESCE(note, ''),
  COALESCE(shared_rar_password, ''),
  COALESCE(downloads, 0),
  COALESCE(views, 0),
  COALESCE(likes, 0),
  COALESCE(dislikes, 0),
  trending,
  'published',
  COALESCE(upload_date, NOW()::TEXT)::TIMESTAMP WITH TIME ZONE
FROM items_backup
ON CONFLICT (id) DO NOTHING;

-- 4. Migrate mirrors from cloud_downloads
-- (This is a complex transform - run separately after data migration)
-- We'll handle this in the Node.js migration script

-- 5. Create indexes on new table
CREATE INDEX IF NOT EXISTS idx_games_slug ON games(slug);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_repacker ON games(repacker_name);
CREATE INDEX IF NOT EXISTS idx_games_downloads ON games(downloads DESC);
CREATE INDEX IF NOT EXISTS idx_games_created ON games(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_games_genres ON games USING GIN(genres);

-- 6. Update repacker game counts
UPDATE repackers SET total_games = (
  SELECT COUNT(*) FROM games WHERE games.repacker_name = repackers.name
);

-- 7. Verify migration
DO $$
BEGIN
  RAISE NOTICE 'Migration complete. Games count: %', (SELECT COUNT(*) FROM games);
  RAISE NOTICE 'Old items count: %', (SELECT COUNT(*) FROM items_backup);
END $$;
