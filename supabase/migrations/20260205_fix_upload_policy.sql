-- Migration: Fix Storage Upload Policy
-- Date: 2026-02-05
-- Description: Fixes the RLS policy for uploads to use correct authentication check

-- Drop the incorrect policy
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;

-- Create the correct policy
-- This policy allows uploads for any authenticated user (checking if auth.uid() exists)
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK ( 
  bucket_id = 'media-assets' 
  AND (SELECT auth.uid()) IS NOT NULL 
);
