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
  system_requirements JSONB DEFAULT '{"recommended": {"os": "", "processor": "", "memory": "", "graphics": "", "storage": ""}}',
  android_requirements JSONB DEFAULT '{"recommended": {"os": "", "ram": "", "storage": "", "processor": ""}}',
  shared_pin_code TEXT NOT NULL,
  shared_rar_password TEXT,
  cloud_downloads JSONB DEFAULT '[]',
  upload_date TEXT NOT NULL
);

-- Create admin_credentials table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_trending ON items(trending);
CREATE INDEX IF NOT EXISTS idx_items_latest ON items(latest);
CREATE INDEX IF NOT EXISTS idx_comments_item_id ON comments(item_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_download_pages_game_id ON download_pages(game_id);
CREATE INDEX IF NOT EXISTS idx_download_pages_expires_at ON download_pages(expires_at);

-- Insert default admin credentials
INSERT INTO admin_credentials (username, password)
VALUES ('admin', 'blackbullz2024')
ON CONFLICT (username) DO NOTHING;

-- Enable Row Level Security (RLS) - optional but recommended for security
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_pages ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations on items" ON items FOR ALL USING (true);
CREATE POLICY "Allow all operations on admin_credentials" ON admin_credentials FOR ALL USING (true);
CREATE POLICY "Allow all operations on comments" ON comments FOR ALL USING (true);
CREATE POLICY "Allow all operations on download_pages" ON download_pages FOR ALL USING (true);