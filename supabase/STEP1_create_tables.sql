-- ==========================================
-- STEP 1: CREATE TABLES FIRST
-- ==========================================
-- Run this FIRST in Supabase SQL Editor
-- This creates all the basic tables without any data

-- 1. PROFILES TABLE (Users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  email text,
  name text,
  role text DEFAULT 'user',
  wishlist text[] DEFAULT ARRAY[]::text[]
);

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id text PRIMARY KEY,
  title text NOT NULL,
  category text,
  price numeric,
  originalPrice numeric,
  rating numeric,
  reviews numeric,
  image text,
  description text,
  features text[],
  affiliateLink text,
  affiliateLinkLabel text,
  affiliateLinkTheme text,
  isBestSeller boolean DEFAULT false,
  status text DEFAULT 'published',
  clicks numeric DEFAULT 0,
  localReviews jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 3. POSTS TABLE (Blog)
CREATE TABLE IF NOT EXISTS public.posts (
  id text PRIMARY KEY,
  title text NOT NULL,
  excerpt text,
  content text,
  author text,
  date text,
  category text,
  image text,
  status text DEFAULT 'published',
  linked_product_ids text[] DEFAULT ARRAY[]::text[],
  hero_image_url text,
  comparison_tables jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 4. SITE CONTENT TABLE (Configuration)
CREATE TABLE IF NOT EXISTS public.site_content (
  id text PRIMARY KEY DEFAULT 'main',
  content jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. ANALYTICS TABLE
CREATE TABLE IF NOT EXISTS public.analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text,
  product_id text,
  product_title text,
  product_price numeric,
  source text,
  medium text,
  campaign text,
  referrer text,
  user_agent text,
  timestamp timestamptz DEFAULT now()
);

-- ==========================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- CREATE POLICIES (Allow public access for demo)
-- ==========================================

-- Profiles: Public read, owner write
DROP POLICY IF EXISTS "Public Read Profiles" ON public.profiles;
CREATE POLICY "Public Read Profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owner Write Profiles" ON public.profiles;
CREATE POLICY "Owner Write Profiles" ON public.profiles FOR ALL USING (auth.uid() = id);

-- Products: Public access
DROP POLICY IF EXISTS "Public Read Products" ON public.products;
CREATE POLICY "Public Read Products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable All Access for Products" ON public.products;
CREATE POLICY "Enable All Access for Products" ON public.products FOR ALL USING (true);

-- Posts: Public access
DROP POLICY IF EXISTS "Public Read Posts" ON public.posts;
CREATE POLICY "Public Read Posts" ON public.posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable All Access for Posts" ON public.posts;
CREATE POLICY "Enable All Access for Posts" ON public.posts FOR ALL USING (true);

-- Site Content: Public access
DROP POLICY IF EXISTS "Public Read Site Content" ON public.site_content;
CREATE POLICY "Public Read Site Content" ON public.site_content FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable All Access for Site Content" ON public.site_content;
CREATE POLICY "Enable All Access for Site Content" ON public.site_content FOR ALL USING (true);

-- Analytics: Public insert
DROP POLICY IF EXISTS "Enable Insert Analytics" ON public.analytics;
CREATE POLICY "Enable Insert Analytics" ON public.analytics FOR INSERT WITH CHECK (true);

-- ==========================================
-- INSERT MINIMAL SITE CONTENT
-- ==========================================

INSERT INTO public.site_content (id, content)
VALUES (
  'main',
  '{
    "heroTitle": "Smart Shopping Made Simple.",
    "heroSubtitle": "Discover top-rated products curated by experts.",
    "heroButtonText": "Shop Best Sellers",
    "themeColor": "emerald",
    "season": "none",
    "logoText": "GoSimpleLiving",
    "pageTitle": "GoSimpleLiving | AI-Curated Amazon Deals",
    "seoDescription": "Discover premium AI-curated Amazon affiliate products.",
    "seoKeywords": "Amazon affiliate, AI shopping, reviews",
    "announcementBar": "🔥 Free Shipping on all orders over $50!",
    "footerText": "© 2024 gosimpleliving.com. All rights reserved.",
    "heroImageUrl": "",
    "logoUrl": "",
    "aiChatEnabled": true,
    "categories": [],
    "uiText": {
      "shopNav": "Shop",
      "blogNav": "Blog",
      "searchPlaceholder": "Search products...",
      "clearFiltersButton": "Clear All Filters",
      "noProductsTitle": "No products found",
      "noProductsSubtitle": "Try adjusting your filters or search query.",
      "wishlistTitle": "My Wishlist",
      "wishlistEmptyTitle": "Your wishlist is empty",
      "wishlistEmptySubtitle": "Start browsing to find great deals."
    }
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content;
