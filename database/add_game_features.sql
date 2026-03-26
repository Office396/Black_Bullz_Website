-- Add new columns to items table
ALTER TABLE items ADD COLUMN IF NOT EXISTS trailer_url TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS steam_url TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS landscape_image TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS edition TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS genres JSONB DEFAULT '[]'::jsonb;
ALTER TABLE items ADD COLUMN IF NOT EXISTS downloads INTEGER DEFAULT 0;
ALTER TABLE items ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
ALTER TABLE items ADD COLUMN IF NOT EXISTS uploader_id TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS uploader_name TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;
ALTER TABLE items ADD COLUMN IF NOT EXISTS dislikes INTEGER DEFAULT 0;
ALTER TABLE items ADD COLUMN IF NOT EXISTS published_date TIMESTAMPTZ;

-- Publishers table
CREATE TABLE IF NOT EXISTS publishers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  biography TEXT,
  overview TEXT,
  known_for TEXT,
  gender TEXT,
  birth_place TEXT,
  birthday TEXT,
  logo_url TEXT,
  banner_url TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game reports table
CREATE TABLE IF NOT EXISTS game_reports (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL,
  game_title TEXT,
  user_id TEXT,
  user_name TEXT,
  report_type TEXT NOT NULL DEFAULT 'error',
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User likes/dislikes table
CREATE TABLE IF NOT EXISTS game_reactions (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  reaction TEXT NOT NULL CHECK (reaction IN ('like', 'dislike')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, user_id)
);

-- Custom genres table
CREATE TABLE IF NOT EXISTS custom_genres (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default genres
INSERT INTO custom_genres (name, slug) VALUES
  ('Action', 'action'), ('Adventure', 'adventure'), ('Anime', 'anime'),
  ('Classic', 'classic'), ('Fighting', 'fighting'), ('Horror', 'horror'),
  ('Indie', 'indie'), ('Multiplayer', 'multiplayer'), ('Open World', 'open-world'),
  ('Puzzle', 'puzzle'), ('Racing', 'racing'), ('RPG', 'rpg'),
  ('Simulation', 'simulation'), ('Sports', 'sports'), ('Survival', 'survival'),
  ('VR', 'vr'), ('FPS', 'fps'), ('Strategy', 'strategy'),
  ('Platformer', 'platformer'), ('Stealth', 'stealth'), ('Roguelike', 'roguelike'),
  ('Sandbox', 'sandbox'), ('Visual Novel', 'visual-novel'), ('Casual', 'casual'),
  ('Educational', 'educational'), ('Music', 'music')
ON CONFLICT (slug) DO NOTHING;

-- Function to update like/dislike counts on items table
CREATE OR REPLACE FUNCTION update_reaction_counts(p_game_id INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE items SET
    likes = (SELECT COUNT(*) FROM game_reactions WHERE game_id = p_game_id AND reaction = 'like'),
    dislikes = (SELECT COUNT(*) FROM game_reactions WHERE game_id = p_game_id AND reaction = 'dislike')
  WHERE id = p_game_id;
END;
$$ LANGUAGE plpgsql;

-- Reviews table (requires approval before showing)
CREATE TABLE IF NOT EXISTS game_reviews (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL,
  game_title TEXT,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add badge columns to game_reviews
ALTER TABLE game_reviews ADD COLUMN IF NOT EXISTS user_badge TEXT;
ALTER TABLE game_reviews ADD COLUMN IF NOT EXISTS user_badge_color TEXT;

-- Add status + badge to comments table (if it exists)
ALTER TABLE comments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE comments ADD COLUMN IF NOT EXISTS user_badge TEXT;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS user_badge_color TEXT;
