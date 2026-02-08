-- Fix RLS for site_content and ensure it is writable
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Allow public read access so the site can load
DROP POLICY IF EXISTS "Public Read Site Content" ON public.site_content;
CREATE POLICY "Public Read Site Content" ON public.site_content
FOR SELECT USING (true);

-- Allow write access (matches your existing permissive policy style)
DROP POLICY IF EXISTS "Enable All Access for Site Content" ON public.site_content;
CREATE POLICY "Enable All Access for Site Content" ON public.site_content
FOR ALL USING (true);

-- Seed initial data if missing (prevents empty site)
INSERT INTO public.site_content (id, content)
VALUES (
  'main',
  '{
    "heroTitle": "Smart Shopping Made Simple.",
    "heroSubtitle": "Discover top-rated products curated by experts and powered by AI. We find the best deals on Amazon so you don''t have to.",
    "heroButtonText": "Shop Best Sellers",
    "themeColor": "amber",
    "season": "none",
    "logoText": "GoSimpleLiving",
    "pageTitle": "GoSimpleLiving | AI-Curated Amazon Deals & Shopping Guide",
    "seoDescription": "Discover premium AI-curated Amazon affiliate products. Guided by Gemini AI, find the best deals in Electronics, Home, Outdoors, and more with expert reviews.",
    "seoKeywords": "Amazon affiliate, AI shopping, Gemini AI, product curation, GoSimpleLiving, electronics deals, home essentials, smart shopping assistant",
    "announcementBar": "🔥 Free Shipping on all orders over $50!",
    "footerText": "© 2024 gosimpleliving.com. All rights reserved.",
    "heroImageUrl": "https://picsum.photos/id/1015/1600/900",
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
      "wishlistEmptySubtitle": "Start browsing to find great deals and add them here."
    }
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;
