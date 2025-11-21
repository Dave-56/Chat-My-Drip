-- Run this SQL in your Supabase SQL Editor to create the necessary tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Outfits table
CREATE TABLE IF NOT EXISTS outfits (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_preview_url TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  analysis JSONB NOT NULL,
  name TEXT,
  collection_ids TEXT[] DEFAULT '{}',
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Collections table
CREATE TABLE IF NOT EXISTS collections (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  outfit_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS outfits_user_id_idx ON outfits(user_id);
CREATE INDEX IF NOT EXISTS outfits_saved_at_idx ON outfits(saved_at DESC);
CREATE INDEX IF NOT EXISTS collections_user_id_idx ON collections(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE outfits ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for outfits
-- Users can only see their own outfits
CREATE POLICY "Users can view their own outfits"
  ON outfits FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own outfits
CREATE POLICY "Users can insert their own outfits"
  ON outfits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own outfits
CREATE POLICY "Users can update their own outfits"
  ON outfits FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own outfits
CREATE POLICY "Users can delete their own outfits"
  ON outfits FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for collections
-- Users can only see their own collections
CREATE POLICY "Users can view their own collections"
  ON collections FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own collections
CREATE POLICY "Users can insert their own collections"
  ON collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own collections
CREATE POLICY "Users can update their own collections"
  ON collections FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own collections
CREATE POLICY "Users can delete their own collections"
  ON collections FOR DELETE
  USING (auth.uid() = user_id);

