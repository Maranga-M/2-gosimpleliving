-- Add columns for Affiliate Button Customization
-- Using camelCase identifiers to match the existing TypeScript Product interface assumptions

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS "affiliateLinkLabel" text,
ADD COLUMN IF NOT EXISTS "affiliateLinkTheme" text,
ADD COLUMN IF NOT EXISTS "additionalAffiliateLinks" jsonb DEFAULT '[]'::jsonb;
