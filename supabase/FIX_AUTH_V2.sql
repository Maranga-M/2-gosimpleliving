-- ==========================================
-- FIX AUTH & DATABASE PERMISSIONS (V2)
-- ==========================================
-- Uses only standard Supabase roles (postgres, anon, authenticated, service_role)

-- 1. Grant usage on schemas
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA auth TO postgres, service_role;

-- 2. Grant table permissions (Standard Roles Only)
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, service_role;

-- Allow public access to our tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO postgres, service_role, authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO postgres, service_role, authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO postgres, service_role, authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_content TO postgres, service_role, authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analytics TO postgres, service_role, authenticated, anon;

-- 3. Ensure extensions exist
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;

-- 4. FIX: Drop potentially broken triggers on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_prod ON auth.users;
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;

-- 5. Ensure Storage Permissions
GRANT ALL ON SCHEMA storage TO postgres, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA storage TO postgres, service_role;

-- 6. Simplify Profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Profiles" ON public.profiles;
CREATE POLICY "Public Read Profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owner Write Profiles" ON public.profiles;
CREATE POLICY "Owner Write Profiles" ON public.profiles FOR ALL USING (auth.uid() = id);

-- 7. Reset Admin Password (Safety Measure)
-- NOTE: This updates the password hash directly if the user exists
UPDATE auth.users 
SET encrypted_password = crypt('gmumbi1234567890', gen_salt('bf'))
WHERE email = 'bernardmaranga4@gmail.com';
