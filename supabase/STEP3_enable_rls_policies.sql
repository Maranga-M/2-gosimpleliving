-- ==========================================
-- STEP 3: ENABLE ROLE-BASED RLS POLICIES
-- ==========================================
-- Run this AFTER creating tables and users
-- This implements proper role-based access control

-- ==========================================
-- PROFILES TABLE RLS
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can view all profiles (for public user list)
DROP POLICY IF EXISTS "Profiles: Public Read" ON public.profiles;
CREATE POLICY "Profiles: Public Read"
  ON public.profiles FOR SELECT
  USING (true);

-- Users can update their own profile
DROP POLICY IF EXISTS "Profiles: Owner Update" ON public.profiles;
CREATE POLICY "Profiles: Owner Update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile
DROP POLICY IF EXISTS "Profiles: Owner Insert" ON public.profiles;
CREATE POLICY "Profiles: Owner Insert"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admins can update any profile
DROP POLICY IF EXISTS "Profiles: Admin Update" ON public.profiles;
CREATE POLICY "Profiles: Admin Update"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==========================================
-- PRODUCTS TABLE RLS
-- ==========================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Everyone can read products
DROP POLICY IF EXISTS "Products: Public Read" ON public.products;
CREATE POLICY "Products: Public Read"
  ON public.products FOR SELECT
  USING (true);

-- Editors and admins can insert products
DROP POLICY IF EXISTS "Products: Editor Insert" ON public.products;
CREATE POLICY "Products: Editor Insert"
  ON public.products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('editor', 'admin')
    )
  );

-- Editors and admins can update products
DROP POLICY IF EXISTS "Products: Editor Update" ON public.products;
CREATE POLICY "Products: Editor Update"
  ON public.products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('editor', 'admin')
    )
  );

-- Editors and admins can delete products
DROP POLICY IF EXISTS "Products: Editor Delete" ON public.products;
CREATE POLICY "Products: Editor Delete"
  ON public.products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('editor', 'admin')
    )
  );

-- ==========================================
-- POSTS TABLE RLS
-- ==========================================
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Everyone can read posts
DROP POLICY IF EXISTS "Posts: Public Read" ON public.posts;
CREATE POLICY "Posts: Public Read"
  ON public.posts FOR SELECT
  USING (true);

-- Editors and admins can insert posts
DROP POLICY IF EXISTS "Posts: Editor Insert" ON public.posts;
CREATE POLICY "Posts: Editor Insert"
  ON public.posts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('editor', 'admin')
    )
  );

-- Editors and admins can update posts
DROP POLICY IF EXISTS "Posts: Editor Update" ON public.posts;
CREATE POLICY "Posts: Editor Update"
  ON public.posts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('editor', 'admin')
    )
  );

-- ==========================================
-- SITE_CONTENT TABLE RLS
-- ==========================================
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Everyone can read site content
DROP POLICY IF EXISTS "Site Content: Public Read" ON public.site_content;
CREATE POLICY "Site Content: Public Read"
  ON public.site_content FOR SELECT
  USING (true);

-- Only admins can update site content
DROP POLICY IF EXISTS "Site Content: Admin Update" ON public.site_content;
CREATE POLICY "Site Content: Admin Update"
  ON public.site_content FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==========================================
-- ANALYTICS TABLE RLS
-- ==========================================
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- Everyone can insert analytics events
DROP POLICY IF EXISTS "Analytics: Public Insert" ON public.analytics;
CREATE POLICY "Analytics: Public Insert"
  ON public.analytics FOR INSERT
  WITH CHECK (true);

-- Everyone can read analytics (for dashboard views)
DROP POLICY IF EXISTS "Analytics: Public Read" ON public.analytics;
CREATE POLICY "Analytics: Public Read"
  ON public.analytics FOR SELECT
  USING (true);

-- ==========================================
-- ROLE DEFINITIONS (for reference)
-- ==========================================
-- user: Can read products/posts, manage own profile, add to wishlist
-- editor: Can create/edit/delete products and posts
-- admin: Full access including site content configuration and user management
