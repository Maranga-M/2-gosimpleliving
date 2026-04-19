-- ============================================================
-- GOSIMPLELIVING - MIGRATION 01: NORMALIZATION & INDEXING
-- ============================================================
-- Run this in the Supabase SQL Editor.
-- This script is idempotent (safe to run multiple times).
-- ============================================================

-- ============================================================
-- SECTION 1: PERFORMANCE INDEXES
-- ============================================================
-- These B-tree indexes dramatically speed up queries that
-- filter or order by these commonly used columns.

-- Products: most common query patterns
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products (status);
CREATE INDEX IF NOT EXISTS idx_products_is_best_seller ON public.products ("isBestSeller");
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products (price);

-- Posts: most common query patterns
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts (status);
CREATE INDEX IF NOT EXISTS idx_posts_date ON public.posts (date DESC);
CREATE INDEX IF NOT EXISTS idx_posts_focus_keyword ON public.posts (focus_keyword);

-- Analytics: for dashboard reporting queries
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics (event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_product_id ON public.analytics (product_id);
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON public.analytics (timestamp DESC);

-- Profiles: for role-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);


-- ============================================================
-- SECTION 2: DATA INTEGRITY CONSTRAINTS
-- ============================================================

-- Ensure product prices are never negative
ALTER TABLE public.products
    DROP CONSTRAINT IF EXISTS chk_products_price_non_negative,
    ADD CONSTRAINT chk_products_price_non_negative CHECK (price >= 0);

ALTER TABLE public.products
    DROP CONSTRAINT IF EXISTS chk_products_rating_range,
    ADD CONSTRAINT chk_products_rating_range CHECK (rating >= 0 AND rating <= 5);

-- Ensure product status is always one of the expected values
ALTER TABLE public.products
    DROP CONSTRAINT IF EXISTS chk_products_valid_status,
    ADD CONSTRAINT chk_products_valid_status CHECK (status IN ('published', 'draft', 'archived'));

-- Ensure post status is always one of the expected values
ALTER TABLE public.posts
    DROP CONSTRAINT IF EXISTS chk_posts_valid_status,
    ADD CONSTRAINT chk_posts_valid_status CHECK (status IN ('published', 'draft', 'archived'));

-- Ensure profile role is always one of the expected values
ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS chk_profiles_valid_role,
    ADD CONSTRAINT chk_profiles_valid_role CHECK (role IN ('user', 'admin', 'editor'));


-- ============================================================
-- SECTION 3: AUTO-SYNC PROFILES TRIGGER
-- ============================================================
-- This trigger automatically creates a profile row in public.profiles
-- whenever a new user signs up via Supabase Auth.
-- This prevents orphan auth users with no corresponding profile.

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'User'),
    'user'
  )
  ON CONFLICT (id) DO NOTHING; -- Don't overwrite if profile already exists (e.g., upgrade)
  RETURN NEW;
END;
$$;

-- Drop any pre-existing version of this trigger to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger to fire AFTER a new user is inserted
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();


-- ============================================================
-- SECTION 4: PRODUCTION-GRADE RLS POLICIES
-- ============================================================
-- Replaces the dev-mode "USING (true)" policies with proper
-- role-based access control (RBAC) using admin checks.

-- Helper function: Check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Helper function: Check if the current user is an admin or editor
CREATE OR REPLACE FUNCTION public.is_admin_or_editor()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'editor')
  );
$$;

-- --- PRODUCTS RLS ---
DROP POLICY IF EXISTS "Public Read Products" ON public.products;
DROP POLICY IF EXISTS "Enable All Access for Products" ON public.products;

-- Anyone can read published products
CREATE POLICY "Public Read Published Products"
  ON public.products FOR SELECT
  USING (status = 'published' OR public.is_admin_or_editor());

-- Only admins/editors can insert, update, or delete
CREATE POLICY "Admin/Editor Full Access to Products"
  ON public.products FOR ALL
  USING (public.is_admin_or_editor())
  WITH CHECK (public.is_admin_or_editor());


-- --- POSTS RLS ---
DROP POLICY IF EXISTS "Public Read Posts" ON public.posts;
DROP POLICY IF EXISTS "Enable All Access for Posts" ON public.posts;

-- Anyone can read published posts
CREATE POLICY "Public Read Published Posts"
  ON public.posts FOR SELECT
  USING (status = 'published' OR public.is_admin_or_editor());

-- Only admins/editors can write
CREATE POLICY "Admin/Editor Full Access to Posts"
  ON public.posts FOR ALL
  USING (public.is_admin_or_editor())
  WITH CHECK (public.is_admin_or_editor());


-- --- SITE CONTENT RLS ---
DROP POLICY IF EXISTS "Public Read Site Content" ON public.site_content;
DROP POLICY IF EXISTS "Enable All Access for Site Content" ON public.site_content;

CREATE POLICY "Public Read Site Content"
  ON public.site_content FOR SELECT
  USING (true);

CREATE POLICY "Admin Only Write Site Content"
  ON public.site_content FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- --- ANALYTICS RLS ---
DROP POLICY IF EXISTS "Enable Insert Analytics" ON public.analytics;

-- Anyone can insert analytics events (click tracking)
CREATE POLICY "Enable Public Insert Analytics"
  ON public.analytics FOR INSERT
  WITH CHECK (true);

-- Only admins can read analytics
CREATE POLICY "Admin Read Analytics"
  ON public.analytics FOR SELECT
  USING (public.is_admin());


-- ============================================================
-- SECTION 5: UPDATED_AT AUTO-UPDATE TRIGGER
-- ============================================================
-- Automatically updates the `updated_at` column whenever a
-- row in site_content is updated.

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_updated_at ON public.site_content;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.site_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- DONE! Apply NOTIFY to reload PostgREST schema cache.
-- ============================================================
NOTIFY pgrst, 'reload schema';
