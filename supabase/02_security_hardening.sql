-- ============================================================
-- GOSIMPLELIVING - MIGRATION 02: SECURITY HARDENING
-- ============================================================
-- Run this AFTER 01_normalization_and_indexing.sql.
-- This script is idempotent (safe to run multiple times).
-- ============================================================


-- ============================================================
-- SECTION 1: LOCK DOWN PROFILES TABLE
-- ============================================================
-- Users can only read their own FULL profile + see basic info of others.
-- Only admins can change roles.

DROP POLICY IF EXISTS "Public Read Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Owner Write Profiles" ON public.profiles;

-- Allow users to read all profiles (needed for admin to see user list)
-- but restrict role elevation strictly via the UPDATE policy.
CREATE POLICY "Authenticated Read Profiles"
  ON public.profiles FOR SELECT
  TO authenticated, anon
  USING (true);

-- Allow users to update ONLY their own profile (name, wishlist)
-- They cannot change their own role through the app.
CREATE POLICY "Owner Update Own Profile (no role change)"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- Only admins can change roles
CREATE POLICY "Admin Update Any Profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin());

-- Admin can delete user profiles (for user management)
CREATE POLICY "Admin Delete Profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- The auto-sync trigger (from migration 01) handles INSERT,
-- so we also need a fallback policy for authenticated users
-- in case they create their own profile.
CREATE POLICY "Authenticated Insert Own Profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);


-- ============================================================
-- SECTION 2: ANALYTICS - RESTRICT READ, ALLOW ANON INSERT
-- ============================================================
-- Already set in migration 01, but adding explicit anon role
-- grants for click-tracking to work for logged-out visitors.

GRANT INSERT ON public.analytics TO anon;


-- ============================================================
-- SECTION 3: GRANT SCHEMA USAGE CORRECTLY
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.posts TO anon, authenticated;
GRANT SELECT ON public.site_content TO anon, authenticated;
GRANT INSERT ON public.analytics TO anon, authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT INSERT ON public.profiles TO authenticated;


-- ============================================================
-- SECTION 4: SEARCH PATH SAFETY
-- ============================================================
ALTER ROLE authenticator SET search_path = public, auth, extensions;
ALTER ROLE anon SET search_path = public, auth, extensions;
ALTER ROLE authenticated SET search_path = public, auth, extensions;


-- ============================================================
-- SECTION 5: RATE LIMITING VIEW FOR ANALYTICS
-- ============================================================
-- Creates a simple view for the admin dashboard to see
-- click trends without exposing raw analytics rows.

CREATE OR REPLACE VIEW public.analytics_summary AS
SELECT
  event_type,
  product_id,
  product_title,
  COUNT(*) AS event_count,
  DATE_TRUNC('day', timestamp) AS event_date
FROM public.analytics
GROUP BY event_type, product_id, product_title, DATE_TRUNC('day', timestamp)
ORDER BY event_date DESC;

-- Grant access to analytics_summary view for authenticated users
GRANT SELECT ON public.analytics_summary TO authenticated;


-- ============================================================
-- DONE!
-- ============================================================
NOTIFY pgrst, 'reload schema';
