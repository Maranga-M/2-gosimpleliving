-- Migration: Add hero_image_url to blog_posts table
-- Created: 2026-01-20

-- Add hero image URL column to blog posts
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS hero_image_url TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_hero_image_url ON blog_posts(hero_image_url);

-- Note: Custom pages are stored in site_content JSONB column
-- No additional schema changes needed for custom page hero images or comparison tables
-- Those will be stored as part of the customPages JSONB structure in site_content
