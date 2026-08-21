-- ============================================================
-- AUDIT LOGS TABLE
-- Track all admin actions for accountability
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  
  -- Action
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('game', 'mirror', 'comment', 'repacker', 'user', 'worker', 'settings', 'takedown')),
  entity_id INTEGER NOT NULL DEFAULT 0,
  
  -- Actor
  admin_user TEXT NOT NULL,
  
  -- Details
  details JSONB DEFAULT '{}',
  
  -- Context
  ip_address TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_admin ON audit_logs(admin_user);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_audit_entity_created ON audit_logs(entity_type, entity_id, created_at DESC);

-- ============================================================
-- GAME RATINGS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS game_ratings (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT DEFAULT '',
  helpful INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_game ON game_ratings(game_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user ON game_ratings(user_id);

-- ============================================================
-- HELPER FUNCTIONS FOR RATINGS
-- ============================================================

CREATE OR REPLACE FUNCTION increment_rating_helpful(rating_id INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE game_ratings SET helpful = helpful + 1 WHERE id = rating_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- HELPER FUNCTIONS FOR COMMENTS
-- ============================================================

CREATE OR REPLACE FUNCTION increment_comment_likes(comment_id INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE comments SET likes = likes + 1 WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_comment_dislikes(comment_id INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE comments SET dislikes = dislikes + 1 WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- HELPER FUNCTIONS FOR MIRRORS
-- ============================================================

CREATE OR REPLACE FUNCTION increment_mirror_clicks(mirror_id INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE mirrors SET clicks = clicks + 1 WHERE id = mirror_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- HELPER FUNCTIONS FOR AFFILIATES
-- ============================================================

CREATE OR REPLACE FUNCTION increment_affiliate_clicks(affiliate_id INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE affiliate_links SET clicks = clicks + 1 WHERE id = affiliate_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_affiliate_conversions(affiliate_id INTEGER, earnings NUMERIC)
RETURNS void AS $$
BEGIN
  UPDATE affiliate_links SET conversions = conversions + 1, earnings = affiliate_links.earnings + earnings WHERE id = affiliate_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- REPACKER PRIORITY TABLE (if not exists)
-- ============================================================

CREATE TABLE IF NOT EXISTS repacker_priorities (
  id SERIAL PRIMARY KEY,
  repacker_slug TEXT UNIQUE NOT NULL,
  priority INTEGER NOT NULL DEFAULT 50,
  color TEXT DEFAULT '#888888',
  icon_url TEXT DEFAULT '',
  installer_icon_url TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default priorities
INSERT INTO repacker_priorities (repacker_slug, priority, color) VALUES
  ('fitgirl', 100, '#ff6b6b'),
  ('dodi', 90, '#4ecdc4'),
  ('elamigos', 80, '#45b7d1'),
  ('ovagames', 75, '#96ceb4'),
  ('kaos', 70, '#ffeaa7'),
  ('cpy', 65, '#dda0dd'),
  ('plaza', 60, '#98d8c8'),
  ('codex', 55, '#f7dc6f'),
  ('ali213', 50, '#82e0aa'),
  ('empress', 45, '#f8c291')
ON CONFLICT (repacker_slug) DO NOTHING;

-- ============================================================
-- MIRROR EXPIRY INDEX
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_mirrors_expiry ON mirrors(status, last_checked)
  WHERE status = 'dead';

-- ============================================================
-- RELATED GAMES FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION get_related_games(
  game_id INTEGER,
  game_genres TEXT[],
  limit_count INTEGER DEFAULT 10
)
RETURNS SETOF games AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT g.*
  FROM games g
  WHERE g.id != game_id
    AND g.status = 'published'
    AND g.genres && game_genres
  ORDER BY
    array_length(array(SELECT unnest(g.genres) INTERSECT SELECT unnest(game_genres)), 1) DESC,
    g.downloads DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
