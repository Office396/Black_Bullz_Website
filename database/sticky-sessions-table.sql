-- ============================================================
-- STICKY SESSIONS TABLE
-- Session affinity for affiliate links
-- ============================================================

CREATE TABLE IF NOT EXISTS sticky_sessions (
  id SERIAL PRIMARY KEY,
  
  session_id TEXT UNIQUE NOT NULL,
  affiliate_id INTEGER REFERENCES affiliate_links(id) ON DELETE SET NULL,
  affiliate_network TEXT DEFAULT '',
  affiliate_url TEXT DEFAULT '',
  
  -- Geo & Device
  country TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  
  -- Stats
  page_views INTEGER DEFAULT 1,
  downloads INTEGER DEFAULT 0,
  
  -- Expiry
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ss_session ON sticky_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_ss_expires ON sticky_sessions(expires_at);

-- ============================================================
-- CLEANUP FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION clean_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM sticky_sessions WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
