-- ============================================================
-- OPERATIONAL SYSTEM TABLES
-- Bug reports, video ads, proxies, ad variants, version tracking
-- ============================================================

-- ============================================================
-- 1. BUG REPORTS TABLE
-- User-reported issues with games/mirrors
-- ============================================================

CREATE TABLE IF NOT EXISTS bug_reports (
  id SERIAL PRIMARY KEY,
  
  -- What was reported
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  mirror_id INTEGER REFERENCES mirrors(id) ON DELETE SET NULL,
  
  -- Who reported
  user_id TEXT,
  ip_address TEXT NOT NULL,
  
  -- Report details
  bug_type TEXT NOT NULL CHECK (bug_type IN (
    'crash', 'black_screen', 'missing_files', 'wrong_password',
    'corrupt', 'virus_false_positive', 'install_fail', 'other'
  )),
  description TEXT NOT NULL DEFAULT '',
  game_version TEXT,
  repacker_name TEXT,
  
  -- System info (optional)
  system_info JSONB DEFAULT '{}',
  
  -- Resolution
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'disputed', 'resolved'
  )),
  auto_action TEXT CHECK (auto_action IN ('hidden', 'downgraded', 'flagged', 'none')),
  resolution_notes TEXT,
  resolved_by TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bug_reports_game ON bug_reports(game_id);
CREATE INDEX IF NOT EXISTS idx_bug_reports_mirror ON bug_reports(mirror_id);
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_created ON bug_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bug_reports_ip ON bug_reports(ip_address, created_at DESC);

-- ============================================================
-- 2. VIDEO ADS TABLE
-- Pre-roll video ad configurations
-- ============================================================

CREATE TABLE IF NOT EXISTS video_ads (
  id SERIAL PRIMARY KEY,
  
  name TEXT NOT NULL,
  video_url TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 15,
  click_through_url TEXT NOT NULL,
  
  -- Targeting
  target_countries TEXT[] DEFAULT '{}',
  min_session_duration INTEGER DEFAULT 10,
  
  -- Performance
  impressions INTEGER DEFAULT 0,
  completions INTEGER DEFAULT 0,
  skips INTEGER DEFAULT 0,
  revenue NUMERIC(10,4) DEFAULT 0,
  
  -- Status
  priority INTEGER DEFAULT 50,
  active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 3. VIDEO AD IMPRESSIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS video_ad_impressions (
  id SERIAL PRIMARY KEY,
  ad_id INTEGER REFERENCES video_ads(id) ON DELETE CASCADE,
  country TEXT DEFAULT '',
  session_duration NUMERIC(10,2) DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vai_ad ON video_ad_impressions(ad_id);
CREATE INDEX IF NOT EXISTS idx_vai_created ON video_ad_impressions(created_at DESC);

-- ============================================================
-- 4. VIDEO AD COMPLETIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS video_ad_completions (
  id SERIAL PRIMARY KEY,
  ad_id INTEGER REFERENCES video_ads(id) ON DELETE CASCADE,
  country TEXT DEFAULT '',
  reward_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 5. VIDEO AD SKIPS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS video_ad_skips (
  id SERIAL PRIMARY KEY,
  ad_id INTEGER REFERENCES video_ads(id) ON DELETE CASCADE,
  watched_seconds NUMERIC(5,2) DEFAULT 0,
  country TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 6. PROXY SERVERS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS proxy_servers (
  id TEXT PRIMARY KEY,
  
  host TEXT NOT NULL,
  port INTEGER NOT NULL,
  username TEXT,
  password TEXT,
  protocol TEXT DEFAULT 'http' CHECK (protocol IN ('http', 'https', 'socks5')),
  
  -- Metadata
  country TEXT DEFAULT '',
  isp TEXT DEFAULT '',
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dead', 'slow', 'banned')),
  last_used TIMESTAMP WITH TIME ZONE,
  last_checked TIMESTAMP WITH TIME ZONE,
  
  -- Performance
  success_rate NUMERIC(5,4) DEFAULT 1.0,
  avg_response_time INTEGER DEFAULT 0,
  total_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  
  -- Bandwidth
  bandwidth_used BIGINT DEFAULT 0,
  bandwidth_limit BIGINT DEFAULT 107374182400, -- 100GB
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 7. PROXY USAGE LOGS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS proxy_usage_logs (
  id SERIAL PRIMARY KEY,
  proxy_id TEXT REFERENCES proxy_servers(id) ON DELETE SET NULL,
  worker_name TEXT NOT NULL,
  target_host TEXT NOT NULL,
  success BOOLEAN DEFAULT TRUE,
  response_time INTEGER DEFAULT 0,
  bytes_uploaded BIGINT DEFAULT 0,
  error_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pul_proxy ON proxy_usage_logs(proxy_id);
CREATE INDEX IF NOT EXISTS idx_pul_created ON proxy_usage_logs(created_at DESC);

-- ============================================================
-- 8. AD VARIANTS TABLE (A/B Testing)
-- ============================================================

CREATE TABLE IF NOT EXISTS ad_variants (
  id TEXT PRIMARY KEY,
  
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  traffic_percent NUMERIC(5,2) DEFAULT 33,
  
  -- Performance
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  revenue NUMERIC(10,4) DEFAULT 0,
  ctr NUMERIC(5,4) DEFAULT 0,
  rpm NUMERIC(10,4) DEFAULT 0,
  
  -- Status
  active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 9. VERSION HISTORY TABLE
-- Track all versions of a game across repackers
-- ============================================================

CREATE TABLE IF NOT EXISTS version_history (
  id SERIAL PRIMARY KEY,
  
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  game_title TEXT NOT NULL,
  
  -- Version info
  raw_version TEXT NOT NULL,
  normalized_version TEXT NOT NULL,
  repacker_name TEXT NOT NULL,
  
  -- Links
  source_url TEXT,
  torrent_url TEXT,
  magnet_link TEXT,
  
  -- Detection
  detected_source TEXT DEFAULT 'rss',
  detection_confidence NUMERIC(3,2) DEFAULT 0,
  
  -- Status
  is_latest BOOLEAN DEFAULT TRUE,
  scraped BOOLEAN DEFAULT FALSE,
  scrape_job_id INTEGER,
  
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vh_game ON version_history(game_id);
CREATE INDEX IF NOT EXISTS idx_vh_repacker ON version_history(repacker_name);
CREATE INDEX IF NOT EXISTS idx_vh_normalized ON version_history(normalized_version);
CREATE INDEX IF NOT EXISTS idx_vh_detected ON version_history(detected_at DESC);

-- ============================================================
-- 10. DISCORD SIGNALS TABLE
-- Raw signals from Discord monitoring
-- ============================================================

CREATE TABLE IF NOT EXISTS discord_signals (
  id SERIAL PRIMARY KEY,
  
  -- Source
  channel_id TEXT,
  message_id TEXT,
  message_url TEXT,
  
  -- Parsed data
  repacker TEXT NOT NULL,
  game_title TEXT NOT NULL,
  version TEXT,
  raw_title TEXT NOT NULL,
  
  -- Links
  torrent_url TEXT,
  magnet_link TEXT,
  nfo_text TEXT,
  
  -- Detection
  confidence NUMERIC(3,2) DEFAULT 0,
  source TEXT DEFAULT 'discord',
  
  -- Processing
  processed BOOLEAN DEFAULT FALSE,
  scrape_job_id INTEGER,
  
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ds_processed ON discord_signals(processed);
CREATE INDEX IF NOT EXISTS idx_ds_repacker ON discord_signals(repacker);
CREATE INDEX IF NOT EXISTS idx_ds_detected ON discord_signals(detected_at DESC);

-- ============================================================
-- RPC FUNCTIONS FOR BUG FLAGGING
-- ============================================================

CREATE OR REPLACE FUNCTION increment_mirror_reports(mirror_id INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE mirrors SET score = GREATEST(0, score - 10) WHERE id = mirror_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION hide_mirror(mirror_id INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE mirrors SET status = 'dead', score = 0 WHERE id = mirror_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 11. DISCORD QUEUE TABLE (for sharded bot processing)
-- Crash-recoverable job queue
-- ============================================================

CREATE TABLE IF NOT EXISTS discord_queue (
  id TEXT PRIMARY KEY,
  
  channel_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  
  -- Priority & Status
  priority INTEGER DEFAULT 50,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Error tracking
  error TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_dq_status ON discord_queue(status, priority DESC);
CREATE INDEX IF NOT EXISTS idx_dq_created ON discord_queue(created_at);

-- ============================================================
-- 12. AFFILIATE CLICKS TABLE (for tracking)
-- ============================================================

CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id SERIAL PRIMARY KEY,
  affiliate_id INTEGER REFERENCES affiliate_links(id) ON DELETE SET NULL,
  country TEXT DEFAULT '',
  revenue NUMERIC(10,4) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ac_affiliate ON affiliate_clicks(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_ac_created ON affiliate_clicks(created_at DESC);

-- ============================================================
-- 13. ANALYTICS EVENTS TABLE (local fallback for notrack.ai)
-- ============================================================

CREATE TABLE IF NOT EXISTS analytics_events (
  id SERIAL PRIMARY KEY,
  event_name TEXT NOT NULL,
  event_url TEXT DEFAULT '',
  event_domain TEXT DEFAULT '',
  event_props JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ae_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_ae_created ON analytics_events(created_at DESC);

-- ============================================================
-- REPACKER TRUST SCORE COLUMNS (add to repackers table)
-- ============================================================

-- These are added via ALTER TABLE since repackers table already exists
-- Run these separately:
-- ALTER TABLE repackers ADD COLUMN IF NOT EXISTS trust_score NUMERIC(5,2) DEFAULT 50;
-- ALTER TABLE repackers ADD COLUMN IF NOT EXISTS trust_tier TEXT DEFAULT 'B';
-- ALTER TABLE repackers ADD COLUMN IF NOT EXISTS bug_rate NUMERIC(5,2) DEFAULT 0;
-- ALTER TABLE repackers ADD COLUMN IF NOT EXISTS mirror_health NUMERIC(5,2) DEFAULT 100;
-- ALTER TABLE repackers ADD COLUMN IF NOT EXISTS last_trust_update TIMESTAMP WITH TIME ZONE;
