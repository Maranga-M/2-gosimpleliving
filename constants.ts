import { Product, BlogPost, SiteContent } from './types';

export const INITIAL_CATEGORIES = [
  'Simple kitchen',
  'Decluttered home',
  'Sustainable household',
  'Small-space living',
  'Beginner gardening'
];

export const PRODUCTS: Product[] = [
  {
    id: 'prod-kitchen-1',
    title: 'Tri-Ply Stainless Steel Cookware Set (10-Piece)',
    category: 'Simple kitchen',
    price: 199.99,
    originalPrice: 249.99,
    rating: 4.8,
    reviews: 1420,
    image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80',
    description: 'Durable, non-toxic stainless steel cookware built to last a lifetime. Free from PTFE, PFOA, and synthetic non-stick coatings.',
    features: ['100% Non-Toxic Cookware', 'Tri-Ply Clad Construction', 'Oven Safe to 500°F', 'Lifetime Warranty'],
    affiliateLink: 'https://eartheasy.com/products/stainless-cookware',
    affiliateLinkLabel: 'Buy on Eartheasy',
    affiliateLinkTheme: 'emerald',
    isBestSeller: true,
    status: 'published',
    additionalAffiliateLinks: [
      { label: 'Amazon', url: 'https://www.amazon.com/dp/B08K123456?tag=gosimpleliving-20', theme: 'orange' }
    ]
  },
  {
    id: 'prod-kitchen-2',
    title: 'Reusable Silicone Food Storage Bags (Set of 6)',
    category: 'Simple kitchen',
    price: 34.99,
    originalPrice: 42.00,
    rating: 4.7,
    reviews: 2150,
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
    description: 'Pinch-loc leakproof platinum silicone food storage bags to replace single-use plastic zip bags.',
    features: ['100% Pure Platinum Silicone', 'Dishwasher & Microwave Safe', 'Freezer Safe', 'Zero Plastic Waste'],
    affiliateLink: 'https://eartheasy.com/products/silicone-bags',
    affiliateLinkLabel: 'Buy on Eartheasy',
    affiliateLinkTheme: 'emerald',
    isBestSeller: true,
    status: 'published',
    additionalAffiliateLinks: [
      { label: 'Amazon', url: 'https://www.amazon.com/dp/B08K654321?tag=gosimpleliving-20', theme: 'orange' }
    ]
  },
  {
    id: 'prod-home-1',
    title: 'Modular Sustainable Bamboo Drawer Organizers',
    category: 'Decluttered home',
    price: 29.99,
    originalPrice: 39.99,
    rating: 4.9,
    reviews: 980,
    image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80',
    description: 'Customizable drawer dividers made from 100% natural, rapidly renewable bamboo for neat kitchen and desk storage.',
    features: ['Eco-Friendly Bamboo', 'Customizable Layouts', 'Non-Slip Rubber Feet', 'Water-Resistant Coating'],
    affiliateLink: 'https://www.containerstore.com/s/bamboo-drawer-organizer',
    affiliateLinkLabel: 'Buy on Container Store',
    affiliateLinkTheme: 'blue',
    isBestSeller: true,
    status: 'published',
    additionalAffiliateLinks: [
      { label: 'Amazon', url: 'https://www.amazon.com/dp/B08BAMBOO1?tag=gosimpleliving-20', theme: 'orange' }
    ]
  },
  {
    id: 'prod-sust-1',
    title: 'Solid Laundry Detergent Sheets (100 Loads)',
    category: 'Sustainable household',
    price: 19.99,
    originalPrice: 24.99,
    rating: 4.8,
    reviews: 3200,
    image: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=800&q=80',
    description: 'Zero-waste, plastic-free laundry detergent sheets that dissolve completely in hot or cold water.',
    features: ['Zero Plastic Packaging', 'Pre-measured Easy Sheets', 'Hypoallergenic & Sensitive Skin Safe', 'Carbon-Neutral Shipping'],
    affiliateLink: 'https://eartheasy.com/products/laundry-sheets',
    affiliateLinkLabel: 'Buy on Eartheasy',
    affiliateLinkTheme: 'emerald',
    isBestSeller: false,
    status: 'published',
    additionalAffiliateLinks: [
      { label: 'Amazon', url: 'https://www.amazon.com/dp/B08LAUNDRY?tag=gosimpleliving-20', theme: 'orange' }
    ]
  },
  {
    id: 'prod-garden-1',
    title: 'Cedar Raised Garden Bed Kit with Self-Watering Reservoir',
    category: 'Beginner gardening',
    price: 129.99,
    originalPrice: 159.99,
    rating: 4.9,
    reviews: 640,
    image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80',
    description: 'Rot-resistant natural cedar raised bed designed for easy urban food growing and beginner gardening.',
    features: ['Naturally Rot-Resistant Cedar', 'Self-Watering Sub-Irrigation', 'No Tools Assembly', 'Perfect for Small Yards & Patios'],
    affiliateLink: 'https://eartheasy.com/products/cedar-raised-bed',
    affiliateLinkLabel: 'Buy on Eartheasy',
    affiliateLinkTheme: 'emerald',
    isBestSeller: true,
    status: 'published'
  }
];

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 'post-1',
    title: 'Best Reusable Food Storage Solutions for a Low-Waste Kitchen',
    excerpt: 'Ditch single-use plastics with these durable, easy-to-clean platinum silicone and glass container systems.',
    content: `# Best Reusable Food Storage Solutions for a Low-Waste Kitchen

Reducing kitchen waste starts with replacing single-use plastic wrap and disposable bags with high-quality reusable alternatives.

## Selection Criteria
- **Material safety:** Must be BPA-free, lead-free, food-grade silicone or tempered glass.
- **Durability:** Able to withstand freezer temperatures, boiling water, and repeated dishwasher cycles.
- **Leak resistance:** Airtight pinch or latch seals.

## Top Recommendations

1. **Platinum Silicone Food Bags (Best Overall)**
   - *Pros:* Ultra-durable, highly heat resistant, non-toxic.
   - *Limitations:* Requires thorough drying inside out after washing.

2. **Tempered Glass Nesting Containers (Best for Meal Prep)**
   - *Pros:* Non-staining, oven-safe without lids, clear visibility.
   - *Limitations:* Heavier than silicone options.
`,
    author: 'GoSimpleLiving Editorial Team',
    date: new Date().toISOString(),
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
    heroImageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1600&q=80',
    status: 'published'
  }
];

export const INITIAL_SITE_CONTENT: SiteContent = {
  heroTitle: 'Buy Fewer, Better Products for a Simpler Home',
  heroSubtitle: 'Thoughtful buying guides, practical comparisons, and sustainable recommendations for low-waste living.',
  heroButtonText: 'Explore Buying Guides',
  themeColor: 'emerald',
  logoText: 'GoSimpleLiving',
  pageTitle: 'GoSimpleLiving - Buy Fewer, Better Products for a Simpler Home',
  seoDescription: 'Curated buying guides and durable recommendations for simple kitchens, decluttered homes, and sustainable living.',
  seoKeywords: 'simple living, sustainable products, decluttering, eco-friendly kitchen, small space living',
  announcementBar: '🌿 Sustainable, durable recommendations for lower-waste homes',
  footerText: '© 2026 GoSimpleLiving. All rights reserved.',
  heroImageUrl: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1600&q=80',
  logoUrl: '',
  aiChatEnabled: true,
  uiText: {
    shopNav: 'Shop',
    blogNav: 'Guides',
    pagesNav: 'Pages',
    searchPlaceholder: 'Search simple living products...',
    clearFiltersButton: 'Clear Filters',
    noProductsTitle: 'No products found',
    noProductsSubtitle: 'Try adjusting your filters or category selection.',
    wishlistTitle: 'Saved Products',
    wishlistEmptyTitle: 'No saved items',
    wishlistEmptySubtitle: 'Save products you want to compare later.'
  },
  socialLinks: [],
  categories: INITIAL_CATEGORIES
};
