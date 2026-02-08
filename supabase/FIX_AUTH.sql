-- ==========================================
-- FIX AUTH & DATABASE PERMISSIONS
-- ==========================================
-- Run this in Supabase SQL Editor to fix login errors

-- 1. Grant usage on schemas
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;

-- 2. Grant table permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, service_role;

-- 3. Ensure extensions exist
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;

-- 4. FIX: Drop potentially broken triggers on auth.users
-- (These often cause 500 errors during login if the function is broken)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_prod ON auth.users;
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;

-- 5. Re-grant public access for our app tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO inputs_user, postgres, service_role, authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO inputs_user, postgres, service_role, authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO inputs_user, postgres, service_role, authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_content TO inputs_user, postgres, service_role, authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analytics TO inputs_user, postgres, service_role, authenticated, anon;

-- 6. Ensure Storage Permissions
GRANT ALL ON SCHEMA storage TO postgres, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA storage TO postgres, service_role;

-- 7. Fix Profiles RLS (Just in case)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Profiles" ON public.profiles;
CREATE POLICY "Public Read Profiles" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Owner Write Profiles" ON public.profiles;
CREATE POLICY "Owner Write Profiles" ON public.profiles FOR ALL USING (auth.uid() = id);

-- 8. Verify Admin User Exists & Fix Password
-- This resets the admin password to be 100% sure
UPDATE auth.users 
SET encrypted_password = crypt('gmumbi1234567890', gen_salt('bf'))
WHERE email = 'bernardmaranga4@gmail.com';
