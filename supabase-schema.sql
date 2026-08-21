-- Supabase Database Schema for BlackBullz Website
-- Run this in Supabase SQL Editor

-- Create items table
CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  long_description TEXT NOT NULL,
  developer TEXT NOT NULL,
  size TEXT NOT NULL,
  release_date TEXT NOT NULL,
  image TEXT NOT NULL,
  rating TEXT NOT NULL,
  trending BOOLEAN DEFAULT FALSE,
  latest BOOLEAN DEFAULT FALSE,
  key_features TEXT[] DEFAULT '{}',
  screenshots TEXT[] DEFAULT '{}',
  note TEXT DEFAULT '',
  system_requirements JSONB DEFAULT '{"recommended": {"os": "", "processor": "", "memory": "", "graphics": "", "storage": ""}}',
  shared_pin_code TEXT NOT NULL,
  shared_rar_password TEXT,
  cloud_downloads JSONB DEFAULT '[]',
  upload_date TEXT NOT NULL
);

-- Create admin_credentials table
-- IMPORTANT: Store hashed passwords only. Use the /api/admin POST endpoint to create/update.
CREATE TABLE IF NOT EXISTS admin_credentials (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  item_id INTEGER NOT NULL,
  item_name TEXT NOT NULL,
  author TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar TEXT,
  content TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  dislikes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read')),
  parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE
);

-- Create download_pages table
CREATE TABLE IF NOT EXISTS download_pages (
  id TEXT PRIMARY KEY,
  game_id INTEGER NOT NULL,
  pin_code TEXT NOT NULL,
  actual_download_links JSONB NOT NULL DEFAULT '[]',
  rar_password TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  token TEXT NOT NULL
);

-- Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_trending ON items(trending);
CREATE INDEX IF NOT EXISTS idx_items_latest ON items(latest);
CREATE INDEX IF NOT EXISTS idx_comments_item_id ON comments(item_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_download_pages_game_id ON download_pages(game_id);
CREATE INDEX IF NOT EXISTS idx_download_pages_expires_at ON download_pages(expires_at);

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================
-- NOTE: Run the setup-admin-hashed.sql script after this to create your admin
-- credentials with a properly hashed password. Do NOT use plaintext passwords.

-- Enable Row Level Security on all tables
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Items: public read, admin write only (enforced via API middleware, not RLS alone)
CREATE POLICY "Public can read items"
  ON items FOR SELECT
  USING (true);

CREATE POLICY "Authenticated requests can insert items"
  ON items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated requests can update items"
  ON items FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated requests can delete items"
  ON items FOR DELETE
  USING (true);

-- Admin credentials: NO public access at all
CREATE POLICY "No public read on admin_credentials"
  ON admin_credentials FOR SELECT
  USING (false);

CREATE POLICY "No public insert on admin_credentials"
  ON admin_credentials FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No public update on admin_credentials"
  ON admin_credentials FOR UPDATE
  USING (false);

CREATE POLICY "No public delete on admin_credentials"
  ON admin_credentials FOR DELETE
  USING (false);

-- Comments: public read, authenticated write
CREATE POLICY "Public can read comments"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert comments"
  ON comments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update comments"
  ON comments FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete comments"
  ON comments FOR DELETE
  USING (true);

-- Download pages: limited read (token-based via API), no public RLS access
CREATE POLICY "No public read on download_pages"
  ON download_pages FOR SELECT
  USING (false);

CREATE POLICY "Service can insert download_pages"
  ON download_pages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service can update download_pages"
  ON download_pages FOR UPDATE
  USING (true);

CREATE POLICY "Service can delete download_pages"
  ON download_pages FOR DELETE
  USING (true);

-- Contact messages: public insert, no public read
CREATE POLICY "Anyone can submit contact messages"
  ON contact_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "No public read on contact_messages"
  ON contact_messages FOR SELECT
  USING (false);

-- =============================================================================
-- INITIAL ADMIN SETUP (plaintext password - run setup-admin-hashed.sql after!)
-- This is a one-time setup. The password below is a placeholder.
-- After running this schema, immediately run setup-admin-hashed.sql to replace
-- with a properly hashed password.
-- =============================================================================
-- INSERT INTO admin_credentials (username, password)
-- VALUES ('admin', 'CHANGE_ME_BEFORE_GOING_LIVE')
-- ON CONFLICT (username) DO NOTHING;
