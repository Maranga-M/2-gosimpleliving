-- ==========================================
-- GOSIMPLELIVING DATABASE SETUP SCRIPT
-- ==========================================
-- This script will:
-- 1. Create all necessary tables (idempotent)
-- 2. Set up Row Level Security (RLS) policies
-- 3. Seed the database with demo data
-- ==========================================

-- 1. PROFILES TABLE (Users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY, -- Matches auth.users.id
  email text,
  name text,
  role text DEFAULT 'user',
  wishlist text[] DEFAULT ARRAY[]::text[]
);

-- 2. PRODUCTS TABLE
-- Note: Using quoted identifiers to preserve camelCase to match TypeScript interfaces
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text,
  price numeric,
  "originalPrice" numeric,
  rating numeric,
  reviews numeric,
  image text,
  description text,
  features text[],
  "affiliateLink" text,
  "affiliateLinkLabel" text,
  "affiliateLinkTheme" text,
  "isBestSeller" boolean DEFAULT false,
  status text DEFAULT 'published',
  "regionalPricing" jsonb,
  "additionalAffiliateLinks" jsonb DEFAULT '[]'::jsonb,
  clicks numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 3. POSTS TABLE (Blog)
-- Note: Using snake_case as per service.ts mapping
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  excerpt text,
  content text,
  author text,
  date timestamptz DEFAULT now(),
  image text,
  status text DEFAULT 'published',
  linked_product_ids text[] DEFAULT ARRAY[]::text[],
  hero_image_url text,
  comparison_tables jsonb,
  focus_keyword text,
  meta_title text,
  meta_description text,
  meta_keywords text,
  created_at timestamptz DEFAULT now()
);

-- 4. SITE CONTENT TABLE (Configuration)
CREATE TABLE IF NOT EXISTS public.site_content (
  id text PRIMARY KEY,
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

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- Create PUBLIC READ policies (so the site works for visitors)
DO $$ 
BEGIN
    -- Profiles: Public read, owner write
    DROP POLICY IF EXISTS "Public Read Profiles" ON public.profiles;
    CREATE POLICY "Public Read Profiles" ON public.profiles FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Owner Write Profiles" ON public.profiles;
    CREATE POLICY "Owner Write Profiles" ON public.profiles FOR ALL USING (auth.uid() = id);

    -- Products: Public read, Admin write (simplified to 'True' for demo/dev ease)
    DROP POLICY IF EXISTS "Public Read Products" ON public.products;
    CREATE POLICY "Public Read Products" ON public.products FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Enable All Access for Products" ON public.products;
    CREATE POLICY "Enable All Access for Products" ON public.products FOR ALL USING (true); 

    -- Posts: Public read, Admin write (simplified)
    DROP POLICY IF EXISTS "Public Read Posts" ON public.posts;
    CREATE POLICY "Public Read Posts" ON public.posts FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Enable All Access for Posts" ON public.posts;
    CREATE POLICY "Enable All Access for Posts" ON public.posts FOR ALL USING (true);

    -- Site Content: Public read, Admin write (simplified)
    DROP POLICY IF EXISTS "Public Read Site Content" ON public.site_content;
    CREATE POLICY "Public Read Site Content" ON public.site_content FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Enable All Access for Site Content" ON public.site_content;
    CREATE POLICY "Enable All Access for Site Content" ON public.site_content FOR ALL USING (true);

    -- Analytics: Public insert
    DROP POLICY IF EXISTS "Enable Insert Analytics" ON public.analytics;
    CREATE POLICY "Enable Insert Analytics" ON public.analytics FOR INSERT WITH CHECK (true);
END $$;

-- ==========================================
-- SEED DATA
-- ==========================================

-- 1. SEED SITE CONTENT
INSERT INTO public.site_content (id, content)
VALUES (
  'main',
  '{
    "heroTitle": "Smart Shopping Made Simple.",
    "heroSubtitle": "Discover top-rated products curated by experts and powered by AI. We find the best deals on Amazon so you don''t have to.",
    "heroButtonText": "Shop Best Sellers",
    "themeColor": "emerald",
    "season": "none",
    "logoText": "GoSimpleLiving",
    "pageTitle": "GoSimpleLiving | AI-Curated Amazon Deals",
    "seoDescription": "Discover premium AI-curated Amazon affiliate products.",
    "seoKeywords": "Amazon affiliate, AI shopping, reviews",
    "announcementBar": "🔥 Free Shipping on all orders over $50!",
    "footerText": "© 2024 gosimpleliving.com. All rights reserved.",
    "heroImageUrl": "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
    "logoUrl": "",
    "aiChatEnabled": true,
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

-- 2. SEED PRODUCTS
INSERT INTO public.products (title, category, price, "originalPrice", rating, reviews, image, description, features, "affiliateLink", "isBestSeller", status)
VALUES
(
  'Sony WH-1000XM5 Wireless Headphones',
  'Electronics',
  348.00,
  399.99,
  4.8,
  12500,
  'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'Industry-leading noise cancellation optimized to you. Multi-Noise Sensor technology. Up to 30-hour battery life with quick charging.',
  ARRAY['Active Noise Cancellation', '30 Hour Battery', 'Touch Controls', 'Multipoint Connection'],
  'https://amazon.com',
  true,
  'published'
),
(
  'Nespresso Vertuo Plus Coffee Machine',
  'Home',
  159.00,
  199.00,
  4.7,
  8900,
  'https://images.unsplash.com/photo-1512568400610-62da28bc8a13?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'Brew the perfect cup of coffee with a single touch. Versatile brewing sizes: Espresso, Double Espresso, Gran Lungo, Coffee and Alto.',
  ARRAY['One-Touch Brewing', '5 Cup Sizes', 'Fast Heat Up', 'Automatic Shut-off'],
  'https://amazon.com',
  true,
  'published'
),
(
  'Instant Pot Duo 7-in-1',
  'Kitchen',
  79.99,
  99.99,
  4.9,
  150000,
  'https://images.unsplash.com/photo-1546549063-959546d03d32?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'America''s most loved multi-cooker, built with the latest 3rd generation technology, the microprocessor monitors pressure, temperature, keeps time, and adjusts heating intensity and duration.',
  ARRAY['7-in-1 Functionality', 'Dishwasher Safe', 'Safety Features', 'One-Touch Programs'],
  'https://amazon.com',
  false,
  'published'
),
(
  'Kindle Paperwhite (16 GB)',
  'Electronics',
  139.99,
  139.99,
  4.8,
  5600,
  'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'Now with a 6.8” display and thinner borders, adjustable warm light, up to 10 weeks of battery life, and 20% faster page turns.',
  ARRAY['6.8" Glare-Free Display', 'Adjustable Warm Light', 'Waterproof', 'Weeks of Battery'],
  'https://amazon.com',
  true,
  'published'
),
(
  'Hydro Flask Wide Mouth Bottle',
  'Outdoors',
  39.95,
  44.95,
  4.9,
  22000,
  'https://images.unsplash.com/photo-1602143407151-5111978d38bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'Large enough for a whole day on the river or trails, our 32 oz Wide Mouth Bottle is made with professional-grade stainless steel.',
  ARRAY['TempShield Insulation', 'BPA-Free', 'Durable Design', 'Lifetime Warranty'],
  'https://amazon.com',
  false,
  'published'
);

-- 3. SEED BLOG POSTS
INSERT INTO public.posts (title, excerpt, content, author, image, hero_image_url, status)
VALUES
(
  'The Ultimate Guide to Home Coffee Brewing',
  'Discover the best methods to brew café-quality coffee at home.',
  '# The Ultimate Guide to Home Coffee Brewing\n\nBrewing better coffee at home is a journey...',
  'SimpleLiving Team',
  'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
  'published'
),
(
  'Top 5 Tech Gadgets of 2024',
  'We review the hottest tech gadgets that are worth your money this year.',
  '# Top 5 Tech Gadgets\n\nTechnology moves fast. Here are our top picks...',
  'Tech Editor',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
  'published'
),
(
  'Minimalist Living: How to Start',
  'Simple steps to declutter your home and mind.',
  '# Minimalist Living\n\nMinimalism is not just about having less stuff...',
  'Lifestyle Guru',
  'https://images.unsplash.com/photo-1484100356142-db6ab6244067?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1484100356142-db6ab6244067?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
  'published'
);
