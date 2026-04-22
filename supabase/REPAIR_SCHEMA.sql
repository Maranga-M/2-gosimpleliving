-- ======================================================
-- REPAIR SCHEMA AND POSTGREST CACHE
-- ======================================================
-- Run this in your Supabase SQL Editor if you get:
-- "AuthApiError: Database error querying schema" (500)
-- or "Connection lost" frequently.

-- 1. Reload PostgREST configuration (Clears schema cache)
NOTIFY pgrst, 'reload schema';

-- 2. Repair Search Path (Essential for Auth schema stability)
ALTER ROLE authenticator SET search_path = public, auth, extensions;
ALTER ROLE postgres SET search_path = public, auth, extensions;
ALTER ROLE anon SET search_path = public, auth, extensions;
ALTER ROLE authenticated SET search_path = public, auth, extensions;

-- 3. Ensure Auth triggers aren't broken
-- We drop them and let the app handle profile creation via the service layer
-- to ensure maximum stability and better error logging.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_prod ON auth.users;
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;

-- 4. Re-verify Schema Grants
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT USAGE ON SCHEMA auth TO anon, authenticated;
GRANT SELECT ON public.site_content TO anon, authenticated;
GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.posts TO anon, authenticated;

-- 5. Fix profiles table (The most common cause of RLS 500s)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Profiles" ON public.profiles;
CREATE POLICY "Public Read Profiles" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Owner Write Profiles" ON public.profiles;
CREATE POLICY "Owner Write Profiles" ON public.profiles FOR ALL USING (auth.uid() = id);

-- 6. Done!
-- Refresh your app after running this.
