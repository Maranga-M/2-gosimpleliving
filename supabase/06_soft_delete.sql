-- ============================================================
-- GOSIMPLELIVING - MIGRATION 06: SOFT DELETE SUPPORT
-- ============================================================
-- This migration adds soft-deletion capability to core tables.
-- ============================================================

-- 1. ADD DELETED_AT COLUMNS
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. UPDATE RLS POLICIES TO FILTER OUT SOFT-DELETED ITEMS
-- Products
DROP POLICY IF EXISTS "Public Read Products" ON public.products;
CREATE POLICY "Public Read Products" ON public.products FOR SELECT 
USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Editor Manage Products" ON public.products;
CREATE POLICY "Editor Manage Products" ON public.products FOR ALL 
USING (public.get_auth_role() IN ('admin', 'editor'));

-- Posts
DROP POLICY IF EXISTS "Public Read Posts" ON public.posts;
CREATE POLICY "Public Read Posts" ON public.posts FOR SELECT 
USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Editor Manage Posts" ON public.posts;
CREATE POLICY "Editor Manage Posts" ON public.posts FOR ALL 
USING (public.get_auth_role() IN ('admin', 'editor'));

-- 3. HELPER FUNCTIONS FOR RESTORATION (ADMIN ONLY)
CREATE OR REPLACE FUNCTION public.restore_item(target_table text, target_id uuid)
RETURNS void AS $$
BEGIN
  EXECUTE format('UPDATE public.%I SET deleted_at = NULL WHERE id = %L', target_table, target_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
