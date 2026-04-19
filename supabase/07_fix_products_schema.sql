-- ==========================================
-- STEP 7: FIX PRODUCTS SCHEMA
-- ==========================================
-- Add missing columns to the products table to ensure all frontend fields persist.
-- Run this in the Supabase SQL Editor.

-- 1. Add jsonb columns for complex objects
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS "regionalPricing" jsonb DEFAULT '{}'::jsonb;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS "additionalAffiliateLinks" jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS "localReviews" jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS "originalPrice" numeric;

-- 2. Add text columns for additional IDs and links
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS "cjAffiliateId" text;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS "cjDeepLink" text;

-- 3. Update the description of columns for better clarity (Optional but recommended)
COMMENT ON COLUMN public.products."regionalPricing" IS 'JSON object containing pricing for different regions (e.g., {"UK": {"price": 20, "currency": "GBP"}})';
COMMENT ON COLUMN public.products."additionalAffiliateLinks" IS 'JSON array of objects containing extra affiliate store links';

-- 4. Ensure RLS allows access to these new columns (already covered by existing policies, but good to re-enable)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
