-- ============================================================
-- GOSIMPLELIVING - MIGRATION 03: REALTIME SETUP
-- ============================================================
-- Run this in the Supabase SQL Editor to enable Realtime
-- on key tables. Run AFTER migrations 01 and 02.
-- ============================================================

-- Enable Realtime for the tables that need live updates.
-- This adds the tables to the Supabase Realtime publication.

DO $$
BEGIN
    -- Enable Realtime on analytics (for live dashboard click tracking)
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'analytics'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics;
    END IF;

    -- Enable Realtime on products (for live inventory/price updates in admin)
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'products'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
    END IF;

    -- Enable Realtime on posts (for live blog post updates in admin)
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'posts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
    END IF;

    -- Enable Realtime on site_content (for live theme/customizer preview)
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'site_content'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.site_content;
    END IF;
END $$;

-- Set replica identity to FULL so we get the old row data on UPDATE/DELETE
-- (needed to  detect what changed and update client state efficiently)
ALTER TABLE public.analytics REPLICA IDENTITY FULL;
ALTER TABLE public.products REPLICA IDENTITY FULL;
ALTER TABLE public.posts REPLICA IDENTITY FULL;
ALTER TABLE public.site_content REPLICA IDENTITY FULL;

-- ============================================================
-- DONE!
-- ============================================================
NOTIFY pgrst, 'reload schema';
