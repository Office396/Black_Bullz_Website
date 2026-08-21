-- ============================================================
-- REPACK SITE PRODUCTION SCHEMA
-- Replaces Android/Software with PC-only repack site system
-- ============================================================

-- ============================================================
-- 1. GAMES TABLE (Core - replaces old 'items' table)
-- ============================================================
CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  -- Core metadata
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  long_description TEXT NOT NULL DEFAULT '',
  
  -- Game info
  developer TEXT NOT NULL DEFAULT '',
  publisher TEXT NOT NULL DEFAULT '',
  release_date TEXT,
  repack_date TEXT NOT NULL,
  updated_date TEXT,
  
  -- Visuals
  cover_image TEXT NOT NULL,
  landscape_image TEXT,
  screenshots TEXT[] DEFAULT '{}',
  
  -- Classification
  genres TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  rating NUMERIC(3,1) DEFAULT 0,
  
  -- Size info
  original_size TEXT NOT NULL DEFAULT '',
  repack_size TEXT NOT NULL DEFAULT '',
  
  -- Repacker info
  repacker_name TEXT NOT NULL,
  repacker_url TEXT,
  
  -- System requirements
  system_requirements JSONB DEFAULT '{"minimum": {"os":"","processor":"","memory":"","graphics":"","storage":"","directx":"","sound_card":"","network":""}, "recommended": {"os":"","processor":"","memory":"","graphics":"","storage":"","directx":"","sound_card":"","network":""}}',
  
  -- Languages
  languages TEXT NOT NULL DEFAULT 'English',
  
  -- Download links (mirrors)
  mirrors JSONB DEFAULT '[]',
  
  -- Torrent info
  magnet_link TEXT,
  torrent_seeders INTEGER DEFAULT 0,
  torrent_leechers INTEGER DEFAULT 0,
  torrent_info_hash TEXT,
  
  -- File info
  installation_notes TEXT,
  rar_password TEXT DEFAULT '',
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  canonical_url TEXT,
  
  -- Stats
  downloads INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  dislikes INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'published' CHECK (status IN ('draft','published','archived','removed')),
  trending BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE,
  pinned BOOLEAN DEFAULT FALSE,
  
  -- Source tracking
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual','scraper','api','import')),
  source_url TEXT,
  source_id TEXT,
  nfo_content TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 2. MIRRORS TABLE (File host links per game)
-- ============================================================
CREATE TABLE IF NOT EXISTS mirrors (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  
  -- Host info
  host_name TEXT NOT NULL,
  host_icon TEXT,
  
  -- Links
  download_url TEXT NOT NULL,
  
  -- Part info (for split uploads)
  part_number INTEGER DEFAULT 1,
  total_parts INTEGER DEFAULT 1,
  
  -- File info
  file_name TEXT NOT NULL DEFAULT '',
  file_size TEXT DEFAULT '',
  file_type TEXT DEFAULT '',
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active','dead','checking')),
  last_checked TIMESTAMP WITH TIME ZONE,
  last_alive TIMESTAMP WITH TIME ZONE,
  
  -- Monetized URL (through shortener)
  monetized_url TEXT,
  
  -- Priority/ordering
  priority INTEGER DEFAULT 0,
  
  -- Stats
  clicks INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 3. REPACKERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS repackers (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  url TEXT,
  logo_url TEXT,
  banner_url TEXT,
  description TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  
  -- Visuals
  color TEXT DEFAULT '#888888',
  icon_url TEXT,
  installer_icon_url TEXT,
  
  -- Priority & Status
  priority INTEGER DEFAULT 30,
  active BOOLEAN DEFAULT TRUE,
  verified BOOLEAN DEFAULT FALSE,
  
  -- Trust Score (dynamic, based on bug reports)
  trust_score NUMERIC(5,2) DEFAULT 50,
  trust_tier TEXT DEFAULT 'B' CHECK (trust_tier IN ('S', 'A', 'B', 'C', 'D', 'F')),
  bug_rate NUMERIC(5,2) DEFAULT 0,
  mirror_health NUMERIC(5,2) DEFAULT 100,
  last_trust_update TIMESTAMP WITH TIME ZONE,
  
  -- Social
  social_links JSONB DEFAULT '{}',
  
  -- Tracking
  total_games INTEGER DEFAULT 0,
  total_downloads INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 4. GENRES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS genres (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  game_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 5. TAGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  game_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 6. EARNINGS TABLE (Track revenue per source)
-- ============================================================
CREATE TABLE IF NOT EXISTS earnings (
  id SERIAL PRIMARY KEY,
  
  -- Source
  source TEXT NOT NULL CHECK (source IN ('shortener','ads','affiliate','donation','premium','other')),
  provider TEXT NOT NULL,
  
  -- Amounts
  amount NUMERIC(10,4) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Context
  game_id INTEGER REFERENCES games(id) ON DELETE SET NULL,
  mirror_id INTEGER REFERENCES mirrors(id) ON DELETE SET NULL,
  
  -- Metadata
  click_id TEXT,
  transaction_id TEXT,
  details JSONB DEFAULT '{}',
  
  -- Date
  earned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 7. SHORTENER STATS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS shortener_stats (
  id SERIAL PRIMARY KEY,
  
  -- Provider
  provider TEXT NOT NULL,
  
  -- Counts
  clicks INTEGER DEFAULT 0,
  earnings NUMERIC(10,4) DEFAULT 0,
  cpm NUMERIC(6,4) DEFAULT 0,
  
  -- Date tracking
  stat_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider, stat_date)
);

-- ============================================================
-- 8. SCRAPE JOBS TABLE (Automation tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS scrape_jobs (
  id SERIAL PRIMARY KEY,
  
  -- Job info
  job_type TEXT NOT NULL CHECK (job_type IN ('scrape','upload','publish','check_mirrors','update_metadata')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed','retrying')),
  
  -- Source
  source_url TEXT,
  source_name TEXT,
  
  -- Game reference
  game_id INTEGER REFERENCES games(id) ON DELETE SET NULL,
  
  -- Results
  result JSONB DEFAULT '{}',
  error TEXT,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  
  -- Scheduling
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 9. WORKER STATUS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS worker_status (
  id SERIAL PRIMARY KEY,
  
  worker_name TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'idle' CHECK (status IN ('idle','running','stopped','error')),
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Stats
  total_processed INTEGER DEFAULT 0,
  total_errors INTEGER DEFAULT 0,
  last_job_id INTEGER,
  last_error TEXT,
  
  -- Config
  config JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 10. DAILY STATS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_stats (
  id SERIAL PRIMARY KEY,
  
  stat_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Traffic
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  
  -- Revenue
  earnings_total NUMERIC(10,4) DEFAULT 0,
  earnings_shortener NUMERIC(10,4) DEFAULT 0,
  earnings_ads NUMERIC(10,4) DEFAULT 0,
  earnings_affiliate NUMERIC(10,4) DEFAULT 0,
  
  -- Content
  games_added INTEGER DEFAULT 0,
  mirrors_added INTEGER DEFAULT 0,
  mirrors_dead INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(stat_date)
);

-- ============================================================
-- 11. AD CONFIGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS ad_configs (
  id SERIAL PRIMARY KEY,
  
  ad_network TEXT NOT NULL,
  ad_type TEXT NOT NULL CHECK (ad_type IN ('popunder','banner','native','interstitial','video','smartlink')),
  
  -- Placement
  position TEXT NOT NULL,
  
  -- Code
  script_code TEXT,
  ad_tag TEXT,
  
  -- Revenue tracking
  cpm NUMERIC(6,4) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  earnings NUMERIC(10,4) DEFAULT 0,
  
  -- Status
  active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,
  
  -- Config
  config JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 12. AFFILIATE LINKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS affiliate_links (
  id SERIAL PRIMARY KEY,
  
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  network TEXT NOT NULL,
  category TEXT NOT NULL,
  
  -- Revenue
  commission_type TEXT DEFAULT 'cpa',
  commission_rate NUMERIC(6,2) DEFAULT 0,
  
  -- Stats
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  earnings NUMERIC(10,4) DEFAULT 0,
  
  -- Status
  active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 13. SCRAPE SOURCES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS scrape_sources (
  id SERIAL PRIMARY KEY,
  
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('rss','api','scraper','manual')),
  url TEXT NOT NULL,
  
  -- Parsing config
  parse_config JSONB DEFAULT '{}',
  
  -- Status
  active BOOLEAN DEFAULT TRUE,
  last_scraped TIMESTAMP WITH TIME ZONE,
  total_scraped INTEGER DEFAULT 0,
  total_errors INTEGER DEFAULT 0,
  
  -- Rate limiting
  rate_limit_ms INTEGER DEFAULT 1000,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 14. USERS TABLE (Optional - for premium/subscription)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  
  -- Premium
  is_premium BOOLEAN DEFAULT FALSE,
  premium_expires TIMESTAMP WITH TIME ZONE,
  
  -- Stats
  total_downloads INTEGER DEFAULT 0,
  favorites INTEGER[] DEFAULT '{}',
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active','suspended','banned')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- ============================================================
-- COMMENTS TABLE (Updated)
-- ============================================================
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  author TEXT NOT NULL DEFAULT 'Anonymous',
  email TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  dislikes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'new' CHECK (status IN ('new','approved','spam','deleted')),
  parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- CONTACT_MESSAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS contact_messages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new','read','archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_games_slug ON games(slug);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_repacker ON games(repacker_name);
CREATE INDEX IF NOT EXISTS idx_games_downloads ON games(downloads DESC);
CREATE INDEX IF NOT EXISTS idx_games_views ON games(views DESC);
CREATE INDEX IF NOT EXISTS idx_games_trending ON games(trending);
CREATE INDEX IF NOT EXISTS idx_games_featured ON games(featured);
CREATE INDEX IF NOT EXISTS idx_games_created ON games(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_games_genres ON games USING GIN(genres);
CREATE INDEX IF NOT EXISTS idx_games_tags ON games USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_mirrors_game ON mirrors(game_id);
CREATE INDEX IF NOT EXISTS idx_mirrors_host ON mirrors(host_name);
CREATE INDEX IF NOT EXISTS idx_mirrors_status ON mirrors(status);

CREATE INDEX IF NOT EXISTS idx_earnings_date ON earnings(earned_date DESC);
CREATE INDEX IF NOT EXISTS idx_earnings_source ON earnings(source);
CREATE INDEX IF NOT EXISTS idx_earnings_game ON earnings(game_id);

CREATE INDEX IF NOT EXISTS idx_scrape_jobs_status ON scrape_jobs(status);
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_type ON scrape_jobs(job_type);

CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(stat_date DESC);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Default repackers
INSERT INTO repackers (name, slug, url) VALUES
  ('FitGirl Repacks', 'fitgirl', 'https://fitgirl-repacks.site'),
  ('DODI Repacks', 'dodi', 'https://dodi-repacks.site'),
  ('ElAmigos', 'elamigos', 'https://elamigos-games.com'),
  ('Ova Games', 'ovagames', 'https://ovagames.com'),
  ('SteamRip', 'steamrip', 'https://steamrip.net'),
  ('KaOs RePack', 'kaos', 'https://kaoskrew.org'),
  ('CPY Repacks', 'cpy', ''),
  ('PLAZA', 'plaza', ''),
  ('CODEX', 'codex', ''),
  ('ALI213', 'ali213', ''),
  ('EMPRESS', 'empress', '')
ON CONFLICT (slug) DO NOTHING;

-- Default genres
INSERT INTO genres (name, slug) VALUES
  ('Action', 'action'),
  ('Adventure', 'adventure'),
  ('RPG', 'rpg'),
  ('Strategy', 'strategy'),
  ('Simulation', 'simulation'),
  ('Sports', 'sports'),
  ('Racing', 'racing'),
  ('Puzzle', 'puzzle'),
  ('Horror', 'horror'),
  ('Shooter', 'shooter'),
  ('Open World', 'open-world'),
  ('Survival', 'survival'),
  ('Indie', 'indie'),
  ('Platformer', 'platformer'),
  ('MMORPG', 'mmorpg'),
  ('Fighting', 'fighting'),
  ('Stealth', 'stealth'),
  ('Sandbox', 'sandbox'),
  ('Sci-Fi', 'sci-fi'),
  ('Fantasy', 'fantasy')
ON CONFLICT (slug) DO NOTHING;

-- Default scrape sources
INSERT INTO scrape_sources (name, type, url, parse_config) VALUES
  ('FitGirl RSS', 'rss', 'https://fitgirl-repacks.site/feed/', '{"scraper":"fitgirl"}'),
  ('DODI RSS', 'rss', 'https://dodi-repacks.site/feed/', '{"scraper":"dodi"}'),
  ('OvaGames RSS', 'rss', 'https://ovagames.com/feed/', '{"scraper":"ovagames"}'),
  ('ElAmigos', 'api', 'https://elamigos-games.com', '{"scraper":"elamigos"}'),
  ('Scene Releases', 'rss', 'https://predb.ovh/api/v1/get?limit=50&type=game', '{"type":"scene"}'),
  ('srrdb', 'api', 'https://srrdb.com/api/games/search/?search=&category=game', '{"type":"scene"}')
ON CONFLICT DO NOTHING;

-- Worker configs
INSERT INTO worker_status (worker_name, status, config) VALUES
  ('scraper-rss', 'idle', '{"interval_ms":300000,"max_concurrent":3}'),
  ('scraper-metadata', 'idle', '{"interval_ms":60000,"max_concurrent":2}'),
  ('uploader-1fichier', 'idle', '{"interval_ms":120000,"max_concurrent":1,"api_key":"","api_token":""}'),
  ('uploader-gofile', 'idle', '{"interval_ms":60000,"max_concurrent":3}'),
  ('uploader-pixeldrain', 'idle', '{"interval_ms":60000,"max_concurrent":3}'),
  ('uploader-mediafire', 'idle', '{"interval_ms":300000,"max_concurrent":1}'),
  ('torrent-manager', 'idle', '{"interval_ms":300000,"qbittorrent_url":"http://localhost:8080","qbittorrent_user":"admin","qbittorrent_pass":"adminadmin"}'),
  ('mirror-checker', 'idle', '{"interval_ms":3600000,"check_batch_size":50}'),
  ('shortener-rotator', 'idle', '{"interval_ms":60000}'),
  ('stats-collector', 'idle', '{"interval_ms":86400000}')
ON CONFLICT (worker_name) DO NOTHING;

-- Default ad configs
INSERT INTO ad_configs (ad_network, ad_type, position, script_code, active) VALUES
  ('propellerads', 'popunder', 'all-pages', '<script src="//www.highperformancedformats.com/{{zone_id}}"></script>', false),
  ('monetag', 'popunder', 'all-pages', '<script>window.__monetag_config={zone_id:"{{zone_id}}"};</script>', false),
  ('adsterra', 'banner', 'sidebar', '<div id="adsterra-sidebar">{{zone_code}}</div>', false),
  ('monetag', 'native', 'game-page', '<div id="monetag-native">{{zone_code}}</div>', false),
  ('adsterra', 'interstitial', 'download-page', '<div id="adsterra-interstitial">{{zone_code}}</div>', false)
ON CONFLICT DO NOTHING;

-- Default affiliate links
INSERT INTO affiliate_links (name, url, network, category, commission_type, commission_rate) VALUES
  ('NordVPN', 'https://nordvpn.com/pricing/?ref=your_id', 'nordvpn', 'vpn', 'cpa', 40),
  ('ExpressVPN', 'https://expressvpn.com/order?affiliate_id=your_id', 'expressvpn', 'vpn', 'cpa', 30),
  ('Hostinger', 'https://hostinger.com/?ref=your_id', 'hostinger', 'hosting', 'cpa', 60),
  ('Amazon GPU', 'https://amazon.com/dp/B0XXX?tag=your_tag-20', 'amazon', 'hardware', 'cps', 4)
ON CONFLICT DO NOTHING;

-- ============================================================
-- RPC FUNCTIONS FOR COUNTER INCREMENTS
-- ============================================================

CREATE OR REPLACE FUNCTION increment_mirror_clicks(mirror_id INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE mirrors SET clicks = clicks + 1 WHERE id = mirror_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_downloads(game_id INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE games SET downloads = downloads + 1 WHERE id = game_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_comment_likes(comment_id INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE comments SET likes = likes + 1 WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_comment_dislikes(comment_id INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE comments SET dislikes = dislikes + 1 WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_affiliate_clicks(affiliate_id INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE affiliate_links SET clicks = clicks + 1 WHERE id = affiliate_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- CLEANUP FUNCTION FOR REQUEST LOGS
-- ============================================================

CREATE OR REPLACE FUNCTION clean_old_request_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM request_logs WHERE created_at < NOW() - INTERVAL '24 hours';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
