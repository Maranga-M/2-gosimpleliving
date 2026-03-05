-- ============================================================
-- GOSIMPLELIVING - MASTER SCHEMA RECREATION
-- ============================================================
-- This script RECREATES the entire database schema from scratch.
-- WARNING: This will drop existing products and posts tables.
-- Run this in the Supabase SQL Editor.
-- ============================================================

-- 0. CLEANUP (Optional - Comment out if you don't want to lose data)
-- DROP TABLE IF EXISTS public.products CASCADE;
-- DROP TABLE IF EXISTS public.posts CASCADE;

-- 1. PROFILES TABLE (Users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE,
  name text,
  role text DEFAULT 'user',
  wishlist text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now()
);

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id text PRIMARY KEY,
  title text NOT NULL,
  category text,
  price numeric,
  "originalPrice" numeric,
  rating numeric DEFAULT 0,
  reviews numeric DEFAULT 0,
  image text,
  description text,
  features text[] DEFAULT ARRAY[]::text[],
  "affiliateLink" text,
  "affiliateLinkLabel" text,
  "affiliateLinkTheme" text,
  "isBestSeller" boolean DEFAULT false,
  status text DEFAULT 'draft',
  clicks numeric DEFAULT 0,
  "localReviews" jsonb DEFAULT '[]'::jsonb,
  "regionalPricing" jsonb DEFAULT '{}'::jsonb,
  "additionalAffiliateLinks" jsonb DEFAULT '[]'::jsonb,
  "cjAffiliateId" text,
  "cjDeepLink" text,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 3. POSTS TABLE (Blog)
CREATE TABLE IF NOT EXISTS public.posts (
  id text PRIMARY KEY,
  title text NOT NULL,
  slug text UNIQUE,
  excerpt text,
  content text,
  author text,
  date text,
  category text,
  image text,
  status text DEFAULT 'draft',
  focus_keyword text,
  meta_title text,
  meta_description text,
  meta_keywords text,
  hero_image_url text,
  comparison_tables jsonb DEFAULT '[]'::jsonb,
  linked_product_ids text[] DEFAULT ARRAY[]::text[],
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 4. SITE CONTENT TABLE
CREATE TABLE IF NOT EXISTS public.site_content (
  id text PRIMARY KEY DEFAULT 'main',
  content jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. ANALYTICS TABLE
CREATE TABLE IF NOT EXISTS public.analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text,
  product_id text,
  product_title text,
  product_price numeric,
  source text,
  medium text,
  campaign text,
  referrer text,
  user_agent text,
  timestamp timestamptz DEFAULT now()
);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_valid_url(url text)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE AS $$ 
BEGIN 
  IF url IS NULL OR url = '' THEN RETURN true; END IF;
  RETURN url ~* '^https?://[a-zA-Z0-9]+([\-\.]{1}[a-zA-Z0-9]+)*\.[a-zA-Z]{2,}(:[0-9]{1,5})?(\/.*)?$';
END; $$;

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "Public Read Profiles" ON public.profiles;
CREATE POLICY "Public Read Profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owner Write Profiles" ON public.profiles;
CREATE POLICY "Owner Write Profiles" ON public.profiles FOR ALL USING (auth.uid() = id);

-- Products & Posts & Site Content
DROP POLICY IF EXISTS "Public Read Products" ON public.products;
CREATE POLICY "Public Read Products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin Write Products" ON public.products;
CREATE POLICY "Admin Write Products" ON public.products FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() 
        AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
);

DROP POLICY IF EXISTS "Public Read Posts" ON public.posts;
CREATE POLICY "Public Read Posts" ON public.posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin Write Posts" ON public.posts;
CREATE POLICY "Admin Write Posts" ON public.posts FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() 
        AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
);

DROP POLICY IF EXISTS "Public Read Site Content" ON public.site_content;
CREATE POLICY "Public Read Site Content" ON public.site_content FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin Write Site Content" ON public.site_content;
CREATE POLICY "Admin Write Site Content" ON public.site_content FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() 
        AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
);

-- Analytics
DROP POLICY IF EXISTS "Enable Insert Analytics" ON public.analytics;
CREATE POLICY "Enable Insert Analytics" ON public.analytics FOR INSERT WITH CHECK (true);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Product Validation
CREATE OR REPLACE FUNCTION public.validate_product() RETURNS TRIGGER AS $$
BEGIN
    NEW.title := TRIM(NEW.title);
    IF NEW.title IS NULL OR NEW.title = '' THEN RAISE EXCEPTION 'Product title cannot be empty.'; END IF;
    IF NEW.price IS NOT NULL AND NEW.price < 0 THEN RAISE EXCEPTION 'Product price cannot be negative.'; END IF;
    IF NEW.price IS NOT NULL AND NEW."originalPrice" IS NOT NULL AND NEW."originalPrice" < NEW.price THEN NEW."originalPrice" := NEW.price; END IF;
    IF NEW.rating IS NOT NULL AND (NEW.rating < 0 OR NEW.rating > 5) THEN RAISE EXCEPTION 'Rating must be 0-5.'; END IF;
    IF NEW.status NOT IN ('published', 'draft', 'archived') THEN NEW.status := 'draft'; END IF;
    RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_product_before_write ON public.products;
CREATE TRIGGER validate_product_before_write BEFORE INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.validate_product();

-- Blog Slug Normalization
CREATE OR REPLACE FUNCTION public.normalize_post_slug() RETURNS TRIGGER AS $$
DECLARE
    base_slug text; final_slug text; counter int := 0;
BEGIN
    NEW.title := TRIM(NEW.title);
    IF NEW.title IS NULL OR NEW.title = '' THEN RAISE EXCEPTION 'Post title cannot be empty.'; END IF;
    IF NEW.slug IS NULL OR NEW.slug = '' OR (TG_OP = 'UPDATE' AND OLD.title IS DISTINCT FROM NEW.title AND OLD.slug = NEW.slug) THEN
        base_slug := LOWER(REGEXP_REPLACE(REGEXP_REPLACE(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
        base_slug := TRIM(BOTH '-' FROM base_slug);
        final_slug := base_slug;
        WHILE EXISTS (SELECT 1 FROM public.posts WHERE slug = final_slug AND id IS DISTINCT FROM NEW.id) LOOP
            counter := counter + 1; final_slug := base_slug || '-' || counter;
        END LOOP;
        NEW.slug := final_slug;
    ELSE
        NEW.slug := LOWER(TRIM(BOTH '-' FROM REGEXP_REPLACE(TRIM(NEW.slug), '[^a-zA-Z0-9-]', '-', 'g')));
    END IF;
    IF NEW.status NOT IN ('published', 'draft', 'archived') THEN NEW.status := 'draft'; END IF;
    RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS normalize_post_before_write ON public.posts;
CREATE TRIGGER normalize_post_before_write BEFORE INSERT OR UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.normalize_post_slug();

-- ============================================================
-- SECURITY DEFINER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION delete_user_by_id(target_uid uuid)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if caller is admin (optional, depends on your needs)
  DELETE FROM auth.users WHERE id = target_uid;
END;
$$;

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO public.site_content (id, content)
VALUES ('main','{ "heroTitle": "Smart Shopping Made Simple.", "heroSubtitle": "Discover top-rated products curated by experts.", "heroButtonText": "Shop Best Sellers", "themeColor": "emerald", "categories": [], "uiText": { "shopNav": "Shop", "blogNav": "Blog" } }'::jsonb)
ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content;
