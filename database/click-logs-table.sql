-- ============================================================
-- CLICK LOGS TABLE
-- Track download clicks for analytics and rate limiting
-- ============================================================

CREATE TABLE IF NOT EXISTS click_logs (
  id SERIAL PRIMARY KEY,
  
  -- Context
  game_id INTEGER REFERENCES games(id) ON DELETE SET NULL,
  mirror_id INTEGER REFERENCES mirrors(id) ON DELETE SET NULL,
  host_name TEXT,
  
  -- Geo
  country TEXT DEFAULT '',
  continent TEXT DEFAULT '',
  is_vpn BOOLEAN DEFAULT FALSE,
  
  -- Monetization
  affiliate_id INTEGER,
  ad_injected BOOLEAN DEFAULT FALSE,
  
  -- Request info
  ip_address TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  referrer TEXT DEFAULT '',
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_clicks_game ON click_logs(game_id);
CREATE INDEX IF NOT EXISTS idx_clicks_mirror ON click_logs(mirror_id);
CREATE INDEX IF NOT EXISTS idx_clicks_country ON click_logs(country);
CREATE INDEX IF NOT EXISTS idx_clicks_created ON click_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clicks_ip ON click_logs(ip_address, created_at DESC);

-- ============================================================
-- REQUEST LOGS TABLE (for rate limiting)
-- ============================================================

CREATE TABLE IF NOT EXISTS request_logs (
  id SERIAL PRIMARY KEY,
  ip TEXT NOT NULL,
  path TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_requests_ip_time ON request_logs(ip, created_at DESC);

-- ============================================================
-- IP WHITELIST TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS ip_whitelist (
  id SERIAL PRIMARY KEY,
  ip TEXT UNIQUE NOT NULL,
  reason TEXT DEFAULT '',
  added_by TEXT DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- CLEANUP FUNCTION
-- ============================================================

-- Run this periodically to clean old logs
-- DELETE FROM request_logs WHERE created_at < NOW() - INTERVAL '24 hours';
-- DELETE FROM click_logs WHERE created_at < NOW() - INTERVAL '90 days';
