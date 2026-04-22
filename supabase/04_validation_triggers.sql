-- ============================================================
-- GOSIMPLELIVING - MIGRATION 04: DATA VALIDATION TRIGGERS
-- ============================================================
-- Run this AFTER migrations 01, 02, and 03.
-- This script is idempotent (safe to run multiple times).
-- These triggers enforce data quality at the DB level,
-- so that bad data can never be saved regardless of how
-- the app writes to the database.
-- ============================================================


-- ============================================================
-- SECTION 1: URL VALIDATOR HELPER
-- ============================================================
-- A reusable function that checks if a string is a valid HTTP/HTTPS URL.

CREATE OR REPLACE FUNCTION public.is_valid_url(url text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    -- NULL or empty URLs are allowed (affiliate links are optional)
    IF url IS NULL OR url = '' THEN
        RETURN true;
    END IF;
    -- Must start with http:// or https://
    RETURN url ~* '^https?://[a-zA-Z0-9]+([\-\.]{1}[a-zA-Z0-9]+)*\.[a-zA-Z]{2,}(:[0-9]{1,5})?(\/.*)?$';
END;
$$;


-- ============================================================
-- SECTION 2: PRODUCT VALIDATION TRIGGER
-- ============================================================
-- Validates product data before INSERT or UPDATE.
-- Raises an error if data is invalid so the app can surface it.

CREATE OR REPLACE FUNCTION public.validate_product()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Trim whitespace from title
    NEW.title := TRIM(NEW.title);

    -- Title must not be empty
    IF NEW.title IS NULL OR NEW.title = '' THEN
        RAISE EXCEPTION 'Product title cannot be empty.';
    END IF;

    -- Price must be non-negative (also enforced by constraint in migration 01)
    IF NEW.price IS NOT NULL AND NEW.price < 0 THEN
        RAISE EXCEPTION 'Product price cannot be negative. Got: %', NEW.price;
    END IF;

    -- Original price must be >= price (if both set)
    IF NEW.price IS NOT NULL AND NEW."originalPrice" IS NOT NULL AND NEW."originalPrice" < NEW.price THEN
        -- Auto-correct: set originalPrice = price if it's somehow less
        NEW."originalPrice" := NEW.price;
    END IF;

    -- Rating must be 0-5
    IF NEW.rating IS NOT NULL AND (NEW.rating < 0 OR NEW.rating > 5) THEN
        RAISE EXCEPTION 'Product rating must be between 0 and 5. Got: %', NEW.rating;
    END IF;

    -- Affiliate link must be a valid URL
    IF NOT public.is_valid_url(NEW."affiliateLink") THEN
        RAISE EXCEPTION 'Invalid affiliate link URL: %', NEW."affiliateLink";
    END IF;

    -- Image URL must be valid
    IF NOT public.is_valid_url(NEW.image) THEN
        RAISE EXCEPTION 'Invalid product image URL: %', NEW.image;
    END IF;

    -- Status must be valid (also enforced by constraint in migration 01)
    IF NEW.status NOT IN ('published', 'draft', 'archived') THEN
        NEW.status := 'draft'; -- Default to draft rather than raising error
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_product_before_write ON public.products;
CREATE TRIGGER validate_product_before_write
    BEFORE INSERT OR UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_product();


-- ============================================================
-- SECTION 3: BLOG POST SLUG NORMALIZER TRIGGER
-- ============================================================
-- Automatically generates a URL-safe slug from the post title
-- if a slug column is not already present, or normalizes one.

-- First, add slug column if it doesn't exist
ALTER TABLE public.posts
    ADD COLUMN IF NOT EXISTS slug text;

-- Create unique index on slug for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_slug ON public.posts (slug)
    WHERE slug IS NOT NULL;

CREATE OR REPLACE FUNCTION public.normalize_post_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    base_slug text;
    final_slug text;
    counter    int := 0;
BEGIN
    -- Trim title
    NEW.title := TRIM(NEW.title);

    IF NEW.title IS NULL OR NEW.title = '' THEN
        RAISE EXCEPTION 'Post title cannot be empty.';
    END IF;

    -- Generate slug from title if not provided or title changed
    IF NEW.slug IS NULL OR NEW.slug = '' OR (TG_OP = 'UPDATE' AND OLD.title IS DISTINCT FROM NEW.title AND OLD.slug = NEW.slug) THEN
        -- Convert title to lowercase slug: replace spaces & special chars with hyphens
        base_slug := LOWER(
            REGEXP_REPLACE(
                REGEXP_REPLACE(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g'),
                '\s+', '-', 'g'
            )
        );
        -- Trim leading/trailing hyphens
        base_slug := TRIM(BOTH '-' FROM base_slug);

        final_slug := base_slug;

        -- Handle slug collisions by appending a counter
        WHILE EXISTS (
            SELECT 1 FROM public.posts
            WHERE slug = final_slug AND id IS DISTINCT FROM NEW.id
        ) LOOP
            counter := counter + 1;
            final_slug := base_slug || '-' || counter;
        END LOOP;

        NEW.slug := final_slug;
    ELSE
        -- If slug is manually provided, normalize it
        NEW.slug := LOWER(TRIM(BOTH '-' FROM REGEXP_REPLACE(TRIM(NEW.slug), '[^a-zA-Z0-9-]', '-', 'g')));
    END IF;

    -- Status validation
    IF NEW.status NOT IN ('published', 'draft', 'archived') THEN
        NEW.status := 'draft';
    END IF;

    -- Image URL validation
    IF NOT public.is_valid_url(NEW.image) THEN
        RAISE EXCEPTION 'Invalid post image URL: %', NEW.image;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS normalize_post_before_write ON public.posts;
CREATE TRIGGER normalize_post_before_write
    BEFORE INSERT OR UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.normalize_post_slug();


-- ============================================================
-- SECTION 4: ANALYTICS DATA SANITIZER
-- ============================================================
-- Strips unwanted characters from analytics fields and
-- soft-validates event types before inserting.

CREATE OR REPLACE FUNCTION public.sanitize_analytics()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Sanitize event_type: allow only known values, default to 'click'
    IF NEW.event_type NOT IN ('click', 'view', 'purchase', 'wishlist', 'share') THEN
        NEW.event_type := 'click';
    END IF;

    -- Trim text fields
    NEW.source    := TRIM(COALESCE(NEW.source, ''));
    NEW.medium    := TRIM(COALESCE(NEW.medium, ''));
    NEW.campaign  := TRIM(COALESCE(NEW.campaign, ''));

    -- Enforce timestamp is always set
    IF NEW.timestamp IS NULL THEN
        NEW.timestamp := now();
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sanitize_analytics_before_insert ON public.analytics;
CREATE TRIGGER sanitize_analytics_before_insert
    BEFORE INSERT ON public.analytics
    FOR EACH ROW
    EXECUTE FUNCTION public.sanitize_analytics();


-- ============================================================
-- SECTION 5: PROFILE SANITIZER
-- ============================================================
-- Normalizes email and name before saving, and enforces
-- that role can only be set to valid values.

CREATE OR REPLACE FUNCTION public.sanitize_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Normalize email to lowercase
    IF NEW.email IS NOT NULL THEN
        NEW.email := LOWER(TRIM(NEW.email));
    END IF;

    -- Trim name
    IF NEW.name IS NOT NULL THEN
        NEW.name := TRIM(NEW.name);
        IF NEW.name = '' THEN
            NEW.name := split_part(COALESCE(NEW.email, 'user@example.com'), '@', 1);
        END IF;
    END IF;

    -- Default role if missing
    IF NEW.role IS NULL OR NEW.role NOT IN ('user', 'admin', 'editor') THEN
        NEW.role := 'user';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sanitize_profile_before_write ON public.profiles;
CREATE TRIGGER sanitize_profile_before_write
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.sanitize_profile();


-- ============================================================
-- DONE!
-- ============================================================
NOTIFY pgrst, 'reload schema';
