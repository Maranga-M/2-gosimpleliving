-- ==========================================
-- STEP 3: CREATE ADMIN USER (Run AFTER Steps 1 & 2)
-- ==========================================
-- This creates your admin account

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
  user_email text := 'bernardmaranga4@gmail.com';
  user_password text := 'gmumbi1234567890';
  user_name text := 'Bernard';
BEGIN
  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
    RAISE NOTICE 'User % already exists', user_email;
    
    -- Upgrade existing user to admin
    UPDATE public.profiles 
    SET role = 'admin' 
    WHERE email = user_email;
    
    RETURN;
  END IF;

  -- Insert into auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    is_super_admin
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    user_email,
    crypt(user_password, gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    jsonb_build_object('name', user_name),
    now(),
    now(),
    false
  );

  -- Insert into auth.identities
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    new_user_id,
    jsonb_build_object('sub', new_user_id, 'email', user_email),
    'email',
    new_user_id::text,
    now(),
    now(),
    now()
  );

  -- Insert into public.profiles
  INSERT INTO public.profiles (
    id,
    email,
    name,
    role,
    wishlist
  ) VALUES (
    new_user_id,
    user_email,
    user_name,
    'admin',
    ARRAY[]::text[]
  );

  RAISE NOTICE 'Successfully created admin user: %', user_email;
END $$;
