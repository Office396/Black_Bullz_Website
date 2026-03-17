-- ============================================================
-- BULLZGAMEZ: Users, Publishers, Notifications, Requests, etc.
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Add publisher field to items table
ALTER TABLE items ADD COLUMN IF NOT EXISTS publisher TEXT DEFAULT '';

-- 2. Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  avatar TEXT DEFAULT '',
  banner TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  role TEXT DEFAULT 'user', -- 'user' | 'creator' | 'admin'
  subscription_plan TEXT DEFAULT 'free', -- 'free' | 'fighter' | 'leader' | 'revolutionist'
  subscription_expires_at TIMESTAMPTZ,
  is_creator BOOLEAN DEFAULT FALSE,
  badges TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. User sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Favourites
CREATE TABLE IF NOT EXISTS user_favourites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  game_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

-- 5. Watch history (auto-deleted after 7 days via scheduled job or on-read cleanup)
CREATE TABLE IF NOT EXISTS user_watch_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  game_id INTEGER NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

-- 6. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL = broadcast to all
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- 'info' | 'success' | 'warning' | 'error'
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Game requests (linked to users)
CREATE TABLE IF NOT EXISTS game_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  game_title TEXT NOT NULL,
  platform TEXT DEFAULT 'PC',
  description TEXT DEFAULT '',
  votes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- 'pending' | 'processing' | 'completed' | 'rejected'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Subscription plans config (managed by admin)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY, -- 'fighter' | 'leader' | 'revolutionist'
  name TEXT NOT NULL,
  price_usd NUMERIC NOT NULL,
  features TEXT[] DEFAULT '{}',
  creator_access BOOLEAN DEFAULT FALSE,
  badge TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default plans
INSERT INTO subscription_plans (id, name, price_usd, features, creator_access, badge) VALUES
  ('fighter',      'Freedom Fighter',   5,  ARRAY['Ad-free browsing','Supporter badge','Early access','Priority support'], FALSE, '🥉'),
  ('leader',       'Revolution Leader', 10, ARRAY['Everything in Fighter','Creator mode access','Leaderboard spotlight','Exclusive content'], TRUE, '🥈'),
  ('revolutionist','Revolutionist',     15, ARRAY['Everything in Leader','Top supporter badge','Direct admin contact','Custom profile banner'], TRUE, '🥇')
ON CONFLICT (id) DO NOTHING;

-- 9. Creator uploaded games (tracks which user uploaded which game)
CREATE TABLE IF NOT EXISTS creator_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  game_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favourites_user_id ON user_favourites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_watch_history_user_id ON user_watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_game_requests_user_id ON game_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_games_user_id ON creator_games(user_id);
