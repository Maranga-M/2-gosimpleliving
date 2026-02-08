-- Migration: Fix Insecure Storage Policy
-- Date: 2026-02-05
-- Description: Restricts deletion of media assets to Admin users only (was previously any authenticated user).

-- 1. Drop the insecure policy
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;

-- 2. Create the new secure policy
-- This policy allows deletion only if the user has the 'admin' role in the public.profiles table
CREATE POLICY "Admin Delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'media-assets'
  AND (
    SELECT role FROM public.profiles WHERE id = auth.uid()
  ) = 'admin'
);

-- Note: Ensure "Admins can view all profiles" policy is active on public.profiles for this to work.
