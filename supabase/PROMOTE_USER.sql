-- ==========================================
-- PROMOTE USER TO ADMIN
-- ==========================================
-- Run this in Supabase SQL Editor

DO $$
DECLARE
  target_email text := 'bmaranga2@gmail.com';
BEGIN
  -- 1. Check if user exists in profiles
  IF EXISTS (SELECT 1 FROM public.profiles WHERE email = target_email) THEN
    
    -- Update role to admin
    UPDATE public.profiles 
    SET role = 'admin' 
    WHERE email = target_email;
    
    RAISE NOTICE '✅ Successfully promoted % to admin!', target_email;
    
  ELSE
    -- 2. If not in profiles, check auth.users (maybe profile is missing)
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = target_email) THEN
       -- Insert profile if missing
       INSERT INTO public.profiles (id, email, name, role)
       SELECT id, email, raw_user_meta_data->>'name', 'admin'
       FROM auth.users
       WHERE email = target_email;
       
       RAISE NOTICE '✅ Created profile and promoted % to admin!', target_email;
    ELSE
       RAISE EXCEPTION '❌ User % not found! Please sign up first.', target_email;
    END IF;
  END IF;
END $$;
