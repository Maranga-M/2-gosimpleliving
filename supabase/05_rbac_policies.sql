-- ============================================================
-- GOSIMPLELIVING - MIGRATION 05: ROLE-BASED ACCESS CONTROL (RBAC)
-- ============================================================
-- This script implements granular security for Admin, Editor, and User roles.
-- Run this AFTER migrations 01, 02, 03, and 04.
-- ============================================================

-- 1. SECURE ROLE HELPER FUNCTION
-- This function runs with SECURITY DEFINER so it can read the profiles table
-- even if the user doesn't have direct permission yet.
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS text AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. PROFILES POLICIES
-- Anyone can see basic profile info
DROP POLICY IF EXISTS "Public Read Profiles" ON public.profiles;
CREATE POLICY "Public Read Profiles" ON public.profiles FOR SELECT USING (true);

-- Users can update their own data but NOT their role
DROP POLICY IF EXISTS "Owner Update Profiles" ON public.profiles;
CREATE POLICY "Owner Update Profiles" ON public.profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  (role IS NOT DISTINCT FROM (SELECT role FROM public.profiles WHERE id = auth.uid()))
);

-- Admin can manage everything
DROP POLICY IF EXISTS "Admin Manage Profiles" ON public.profiles;
CREATE POLICY "Admin Manage Profiles" ON public.profiles FOR ALL 
USING (public.get_auth_role() = 'admin');


-- 3. PRODUCTS POLICIES
DROP POLICY IF EXISTS "Enable All Access for Products" ON public.products;
DROP POLICY IF EXISTS "Public Read Products" ON public.products;

-- Public read access
CREATE POLICY "Public Read Products" ON public.products FOR SELECT USING (true);

-- Admin/Editor CRUD access
CREATE POLICY "Editor Manage Products" ON public.products FOR ALL 
USING (public.get_auth_role() IN ('admin', 'editor'));


-- 4. POSTS (BLOG) POLICIES
DROP POLICY IF EXISTS "Enable All Access for Posts" ON public.posts;
DROP POLICY IF EXISTS "Public Read Posts" ON public.posts;

-- Public read access
CREATE POLICY "Public Read Posts" ON public.posts FOR SELECT USING (true);

-- Admin/Editor CRUD access
CREATE POLICY "Editor Manage Posts" ON public.posts FOR ALL 
USING (public.get_auth_role() IN ('admin', 'editor'));


-- 5. SITE CONTENT POLICIES
DROP POLICY IF EXISTS "Enable All Access for Site Content" ON public.site_content;
DROP POLICY IF EXISTS "Public Read Site Content" ON public.site_content;

-- Public read
CREATE POLICY "Public Read Site Content" ON public.site_content FOR SELECT USING (true);

-- Admin ONLY write access (Editors can only read)
CREATE POLICY "Admin Manage Site Content" ON public.site_content FOR ALL 
USING (public.get_auth_role() = 'admin');


-- 6. ANALYTICS POLICIES
DROP POLICY IF EXISTS "Enable Insert Analytics" ON public.analytics;

-- Public can log (insert) but not read
CREATE POLICY "Public Log Analytics" ON public.analytics FOR INSERT WITH CHECK (true);

-- Admin ONLY read access
DROP POLICY IF EXISTS "Admin Read Analytics" ON public.analytics;
CREATE POLICY "Admin Read Analytics" ON public.analytics FOR SELECT 
USING (public.get_auth_role() = 'admin');


-- REFRESH SCHEMA
NOTIFY pgrst, 'reload schema';
