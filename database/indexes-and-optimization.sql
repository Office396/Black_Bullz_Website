-- ============================================================
-- DATABASE INDEXES - Performance Optimization
-- Apply these BEFORE launching to keep queries fast
-- ============================================================

-- ============================================================
-- GAMES TABLE INDEXES
-- ============================================================

-- Unique slug for SEO URLs
CREATE UNIQUE INDEX IF NOT EXISTS idx_games_slug ON games(slug);

-- Status filtering (published games)
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status) WHERE status = 'published';

-- Sorting by date
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_games_repack_date ON games(repack_date DESC);

-- Sorting by popularity
CREATE INDEX IF NOT EXISTS idx_games_downloads ON games(downloads DESC);
CREATE INDEX IF NOT EXISTS idx_games_views ON games(views DESC);

-- Filtering
CREATE INDEX IF NOT EXISTS idx_games_trending ON games(trending) WHERE trending = true;
CREATE INDEX IF NOT EXISTS idx_games_featured ON games(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_games_pinned ON games(pinned) WHERE pinned = true;

-- Repacker filtering
CREATE INDEX IF NOT EXISTS idx_games_repacker ON games(repacker_name);

-- Genre/Tag search (GIN indexes for array contains)
CREATE INDEX IF NOT EXISTS idx_games_genres ON games USING GIN(genres);
CREATE INDEX IF NOT EXISTS idx_games_tags ON games USING GIN(tags);

-- Full-text search
CREATE INDEX IF NOT EXISTS idx_games_title_search ON games USING GIN(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_games_desc_search ON games USING GIN(to_tsvector('english', description));

-- Source tracking
CREATE INDEX IF NOT EXISTS idx_games_source ON games(source, source_url);

-- ============================================================
-- MIRRORS TABLE INDEXES
-- ============================================================

-- Game association (most common query)
CREATE INDEX IF NOT EXISTS idx_mirrors_game_id ON mirrors(game_id);

-- Status filtering
CREATE INDEX IF NOT EXISTS idx_mirrors_status ON mirrors(status);

-- Combined index for active mirrors per game
CREATE INDEX IF NOT EXISTS idx_mirrors_game_status ON mirrors(game_id, status) WHERE status = 'active';

-- Host filtering
CREATE INDEX IF NOT EXISTS idx_mirrors_host ON mirrors(host_name);

-- Health check queries
CREATE INDEX IF NOT EXISTS idx_mirrors_last_checked ON mirrors(last_checked) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_mirrors_dead ON mirrors(status, last_checked) WHERE status = 'dead';

-- Click tracking
CREATE INDEX IF NOT EXISTS idx_mirrors_clicks ON mirrors(clicks DESC);

-- ============================================================
-- COMMENTS TABLE INDEXES
-- ============================================================

-- Game association
CREATE INDEX IF NOT EXISTS idx_comments_game_id ON comments(game_id);

-- Combined index for game comments sorted by date
CREATE INDEX IF NOT EXISTS idx_comments_game_created ON comments(game_id, created_at DESC);

-- Status filtering (moderation queue)
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status) WHERE status != 'deleted';

-- Flagged comments (auto-flagged by moderation)
CREATE INDEX IF NOT EXISTS idx_comments_flagged ON comments(status) WHERE status = 'new';

-- Parent comments (threaded replies)
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id) WHERE parent_id IS NOT NULL;

-- ============================================================
-- EARNINGS TABLE INDEXES
-- ============================================================

-- Date-based queries (reporting)
CREATE INDEX IF NOT EXISTS idx_earnings_date ON earnings(earned_date DESC);

-- Source filtering
CREATE INDEX IF NOT EXISTS idx_earnings_source ON earnings(source, earned_date DESC);

-- Game-specific earnings
CREATE INDEX IF NOT EXISTS idx_earnings_game ON earnings(game_id) WHERE game_id IS NOT NULL;

-- ============================================================
-- SCRAPE_JOBS TABLE INDEXES
-- ============================================================

-- Job queue processing
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_pending ON scrape_jobs(status, created_at)
  WHERE status IN ('pending', 'retrying');

-- Running jobs
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_running ON scrape_jobs(status)
  WHERE status = 'running';

-- Game-specific jobs
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_game ON scrape_jobs(game_id) WHERE game_id IS NOT NULL;

-- ============================================================
-- WORKER_STATUS TABLE INDEXES
-- ============================================================

-- Worker lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_worker_name ON worker_status(worker_name);

-- Heartbeat monitoring
CREATE INDEX IF NOT EXISTS idx_worker_heartbeat ON worker_status(last_heartbeat);

-- ============================================================
-- DAILY_STATS TABLE INDEXES
-- ============================================================

-- Date-based queries
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(stat_date);

-- ============================================================
-- SHORTENER_STATS TABLE INDEXES
-- ============================================================

-- Provider + date reporting
CREATE UNIQUE INDEX IF NOT EXISTS idx_shortener_provider_date ON shortener_stats(provider, stat_date);

-- ============================================================
-- SCRAPE_SOURCES TABLE INDEXES
-- ============================================================

-- Active sources
CREATE INDEX IF NOT EXISTS idx_scrape_sources_active ON scrape_sources(active) WHERE active = true;

-- ============================================================
-- AD_CONFIGS TABLE INDEXES
-- ============================================================

-- Active ads by position
CREATE INDEX IF NOT EXISTS idx_ad_configs_active ON ad_configs(active, position) WHERE active = true;

-- ============================================================
-- AFFILIATE_LINKS TABLE INDEXES
-- ============================================================

-- Active affiliates by category
CREATE INDEX IF NOT EXISTS idx_affiliate_active ON affiliate_links(active, category) WHERE active = true;

-- ============================================================
-- MODERATION QUEUE TABLE INDEXES

-- ============================================================
-- PERFORMANCE VIEWS
-- ============================================================

-- View: Active games with mirror count
CREATE OR REPLACE VIEW v_games_with_mirrors AS
SELECT
  g.id,
  g.title,
  g.slug,
  g.repacker_name,
  g.downloads,
  g.views,
  g.created_at,
  COUNT(m.id) FILTER (WHERE m.status = 'active') as active_mirrors,
  COUNT(m.id) FILTER (WHERE m.status = 'dead') as dead_mirrors,
  MAX(m.last_alive) as last_mirror_alive
FROM games g
LEFT JOIN mirrors m ON m.game_id = g.id
WHERE g.status = 'published'
GROUP BY g.id;

-- View: Dead links requiring attention
CREATE OR REPLACE VIEW v_dead_links AS
SELECT
  m.id,
  m.game_id,
  g.title as game_title,
  m.host_name,
  m.download_url,
  m.last_checked,
  m.last_alive
FROM mirrors m
JOIN games g ON g.id = m.game_id
WHERE m.status = 'dead'
  AND m.last_checked > NOW() - INTERVAL '24 hours'
ORDER BY m.last_checked DESC;

-- View: Worker health overview
CREATE OR REPLACE VIEW v_worker_health AS
SELECT
  worker_name,
  status,
  last_heartbeat,
  total_processed,
  total_errors,
  CASE
    WHEN last_heartbeat < NOW() - INTERVAL '10 minutes' THEN 'stale'
    WHEN status = 'error' THEN 'error'
    ELSE 'healthy'
  END as health_status
FROM worker_status;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Function: Increment download count
CREATE OR REPLACE FUNCTION increment_downloads(game_id INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE games SET downloads = downloads + 1 WHERE id = game_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Increment view count
CREATE OR REPLACE FUNCTION increment_views(game_id INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE games SET views = views + 1 WHERE id = game_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Get game by slug
CREATE OR REPLACE FUNCTION get_game_by_slug(game_slug TEXT)
RETURNS SETOF games AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM games WHERE slug = game_slug AND status = 'published';
END;
$$ LANGUAGE plpgsql;

-- Function: Search games
CREATE OR REPLACE FUNCTION search_games(search_query TEXT)
RETURNS SETOF games AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM games
  WHERE status = 'published'
    AND (
      title ILIKE '%' || search_query || '%'
      OR description ILIKE '%' || search_query || '%'
      OR developer ILIKE '%' || search_query || '%'
      OR publisher ILIKE '%' || search_query || '%'
    )
  ORDER BY downloads DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLES THAT MAY NEED CREATING
-- ============================================================

-- User watchlists
CREATE TABLE IF NOT EXISTS user_watchlists (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  notify_on_repack BOOLEAN DEFAULT TRUE,
  notify_on_update BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

-- Takedown requests
CREATE TABLE IF NOT EXISTS takedown_requests (
  id SERIAL PRIMARY KEY,
  mirror_id INTEGER NOT NULL,
  game_id INTEGER NOT NULL,
  reason TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('dmca', 'copyright', 'legal', 'other')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  requested_by TEXT,
  resolved_by TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Moderation queue
CREATE TABLE IF NOT EXISTS moderation_queue (
  id SERIAL PRIMARY KEY,
  item_type TEXT NOT NULL CHECK (item_type IN ('comment', 'mirror', 'game', 'review')),
  item_id INTEGER NOT NULL,
  reason TEXT NOT NULL,
  severity TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected')),
  auto_flagged BOOLEAN DEFAULT FALSE,
  reviewed_by TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_watchlists_user ON user_watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_game ON user_watchlists(game_id);
CREATE INDEX IF NOT EXISTS idx_takedowns_pending ON takedown_requests(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_moderation_pending ON moderation_queue(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_moderation_type ON moderation_queue(item_type, item_id);
