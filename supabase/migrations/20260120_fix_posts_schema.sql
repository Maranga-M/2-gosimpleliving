-- Migration: Add hero_image_url and comparison_tables to posts table (fixing table name)
-- Created: 2026-01-20

-- Add columns to 'posts' table (correct table name used by service)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS hero_image_url TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS comparison_tables JSONB;

-- Add index for hero image
CREATE INDEX IF NOT EXISTS idx_posts_hero_image_url ON posts(hero_image_url);
