-- ==========================================
-- GOSIMPLELIVING DATABASE SETUP SCRIPT
-- ==========================================
-- This script will:
-- 1. Create all necessary tables (idempotent)
-- 2. Set up Row Level Security (RLS) policies
-- 3. Seed the database with simple-living product data
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

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public Read Profiles" ON public.profiles;
    CREATE POLICY "Public Read Profiles" ON public.profiles FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Owner Write Profiles" ON public.profiles;
    CREATE POLICY "Owner Write Profiles" ON public.profiles FOR ALL USING (auth.uid() = id);

    DROP POLICY IF EXISTS "Public Read Products" ON public.products;
    CREATE POLICY "Public Read Products" ON public.products FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Enable All Access for Products" ON public.products;
    CREATE POLICY "Enable All Access for Products" ON public.products FOR ALL USING (true); 

    DROP POLICY IF EXISTS "Public Read Posts" ON public.posts;
    CREATE POLICY "Public Read Posts" ON public.posts FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Enable All Access for Posts" ON public.posts;
    CREATE POLICY "Enable All Access for Posts" ON public.posts FOR ALL USING (true);

    DROP POLICY IF EXISTS "Public Read Site Content" ON public.site_content;
    CREATE POLICY "Public Read Site Content" ON public.site_content FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Enable All Access for Site Content" ON public.site_content;
    CREATE POLICY "Enable All Access for Site Content" ON public.site_content FOR ALL USING (true);

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
    "heroTitle": "Buy Fewer, Better Products for a Simpler Home",
    "heroSubtitle": "Thoughtful buying guides, practical comparisons, and sustainable recommendations for low-waste living.",
    "heroButtonText": "Explore Buying Guides",
    "themeColor": "emerald",
    "season": "none",
    "logoText": "GoSimpleLiving",
    "pageTitle": "GoSimpleLiving - Buy Fewer, Better Products for a Simpler Home",
    "seoDescription": "Curated buying guides and durable recommendations for simple kitchens, decluttered homes, and sustainable living.",
    "seoKeywords": "simple living, sustainable products, decluttering, eco-friendly kitchen, small space living",
    "announcementBar": "🌿 Sustainable, durable recommendations for lower-waste homes",
    "footerText": "© 2026 GoSimpleLiving. All rights reserved.",
    "heroImageUrl": "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1600&q=80",
    "logoUrl": "",
    "aiChatEnabled": true,
    "categories": [
      "Simple kitchen",
      "Decluttered home",
      "Sustainable household",
      "Small-space living",
      "Beginner gardening"
    ],
    "uiText": {
      "shopNav": "Shop",
      "blogNav": "Guides",
      "searchPlaceholder": "Search simple living products...",
      "clearFiltersButton": "Clear Filters",
      "noProductsTitle": "No products found",
      "noProductsSubtitle": "Try adjusting your filters or category selection.",
      "wishlistTitle": "Saved Products",
      "wishlistEmptyTitle": "No saved items",
      "wishlistEmptySubtitle": "Save products you want to compare later."
    }
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content;

-- 2. SEED PRODUCTS
INSERT INTO public.products (title, category, price, "originalPrice", rating, reviews, image, description, features, "affiliateLink", "affiliateLinkLabel", "affiliateLinkTheme", "isBestSeller", status)
VALUES
(
  'Tri-Ply Stainless Steel Cookware Set (10-Piece)',
  'Simple kitchen',
  199.99,
  249.99,
  4.8,
  1420,
  'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80',
  'Durable, non-toxic stainless steel cookware built to last a lifetime. Free from PTFE, PFOA, and synthetic non-stick coatings.',
  ARRAY['100% Non-Toxic Cookware', 'Tri-Ply Clad Construction', 'Oven Safe to 500°F', 'Lifetime Warranty'],
  'https://eartheasy.com/products/stainless-cookware',
  'Buy on Eartheasy',
  'emerald',
  true,
  'published'
),
(
  'Reusable Silicone Food Storage Bags (Set of 6)',
  'Simple kitchen',
  34.99,
  42.00,
  4.7,
  2150,
  'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
  'Pinch-loc leakproof platinum silicone food storage bags to replace single-use plastic zip bags.',
  ARRAY['100% Pure Platinum Silicone', 'Dishwasher & Microwave Safe', 'Freezer Safe', 'Zero Plastic Waste'],
  'https://eartheasy.com/products/silicone-bags',
  'Buy on Eartheasy',
  'emerald',
  true,
  'published'
),
(
  'Modular Sustainable Bamboo Drawer Organizers',
  'Decluttered home',
  29.99,
  39.99,
  4.9,
  980,
  'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80',
  'Customizable drawer dividers made from 100% natural, rapidly renewable bamboo for neat kitchen and desk storage.',
  ARRAY['Eco-Friendly Bamboo', 'Customizable Layouts', 'Non-Slip Rubber Feet', 'Water-Resistant Coating'],
  'https://www.containerstore.com/s/bamboo-drawer-organizer',
  'Buy on Container Store',
  'blue',
  true,
  'published'
),
(
  'Solid Laundry Detergent Sheets (100 Loads)',
  'Sustainable household',
  19.99,
  24.99,
  4.8,
  3200,
  'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=800&q=80',
  'Zero-waste, plastic-free laundry detergent sheets that dissolve completely in hot or cold water.',
  ARRAY['Zero Plastic Packaging', 'Pre-measured Easy Sheets', 'Hypoallergenic & Sensitive Skin Safe', 'Carbon-Neutral Shipping'],
  'https://eartheasy.com/products/laundry-sheets',
  'Buy on Eartheasy',
  'emerald',
  false,
  'published'
),
(
  'Cedar Raised Garden Bed Kit with Self-Watering Reservoir',
  'Beginner gardening',
  129.99,
  159.99,
  4.9,
  640,
  'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80',
  'Rot-resistant natural cedar raised bed designed for easy urban food growing and beginner gardening.',
  ARRAY['Naturally Rot-Resistant Cedar', 'Self-Watering Sub-Irrigation', 'No Tools Assembly', 'Perfect for Small Yards & Patios'],
  'https://eartheasy.com/products/cedar-raised-bed',
  'Buy on Eartheasy',
  'emerald',
  true,
  'published'
);

-- 3. SEED BLOG POSTS
INSERT INTO public.posts (title, excerpt, content, author, image, hero_image_url, status)
VALUES
(
  'Best Reusable Food Storage Solutions for a Low-Waste Kitchen',
  'Ditch single-use plastics with these durable, easy-to-clean platinum silicone and glass container systems.',
  '# Best Reusable Food Storage Solutions for a Low-Waste Kitchen\n\nReducing kitchen waste starts with replacing single-use plastic wrap and disposable bags with high-quality reusable alternatives.',
  'GoSimpleLiving Editorial Team',
  'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1600&q=80',
  'published'
);
