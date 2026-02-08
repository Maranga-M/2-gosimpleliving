
import { Product, BlogPost, SiteContent } from './types';

export const PRODUCTS: Product[] = [
  {
    id: 'p1',
    title: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
    category: 'Electronics',
    price: 348.00,
    originalPrice: 399.99,
    rating: 4.8,
    reviews: 12500,
    localReviews: [],
    image: 'https://picsum.photos/id/1/600/600',
    description: 'Industry-leading noise canceling with two processors controlling 8 microphones for unprecedented noise cancellation.',
    features: ['30-hour battery life', 'Ultra-clear hands-free calling', 'Alexa built-in'],
    affiliateLink: '#',
    isBestSeller: true,
    status: 'published'
  },
  {
    id: 'p2',
    title: 'Dyson V15 Detect Cordless Vacuum Cleaner',
    category: 'Home & Kitchen',
    price: 649.99,
    originalPrice: 749.99,
    rating: 4.7,
    reviews: 3200,
    localReviews: [],
    image: 'https://picsum.photos/id/2/600/600',
    description: 'Powerful cordless vacuum with laser illumination revealing microscopic dust.',
    features: ['Laser Slim Fluffy cleaner head', 'Piezo sensor', 'LCD screen'],
    affiliateLink: '#',
    isBestSeller: true,
    status: 'published'
  },
  {
    id: 'p3',
    title: 'Instant Pot Duo Plus 9-in-1 Electric Pressure Cooker',
    category: 'Home & Kitchen',
    price: 129.95,
    rating: 4.9,
    reviews: 45000,
    localReviews: [],
    image: 'https://picsum.photos/id/3/600/600',
    description: '9-in-1 functionality: pressure cook, slow cook, rice cooker, yogurt maker, steamer, sauté pan, yogurt maker, sterilizer and food warmer.',
    features: ['Easy-Seal lid', '15 one-touch programs', 'Stainless steel pot'],
    affiliateLink: '#',
    status: 'published'
  },
  {
    id: 'p4',
    title: 'Apple MacBook Air 13.6" Liquid Retina Display',
    category: 'Electronics',
    price: 1099.00,
    originalPrice: 1199.00,
    rating: 4.9,
    reviews: 8900,
    localReviews: [],
    image: 'https://picsum.photos/id/4/600/600',
    description: 'Strikingly thin and fast so you can work, play, or create anywhere.',
    features: ['M2 chip', '18 hours battery life', 'Four-speaker sound system'],
    affiliateLink: '#',
    status: 'published'
  },
  {
    id: 'p5',
    title: 'Patagonia Men\'s Better Sweater Fleece Jacket',
    category: 'Fashion',
    price: 139.00,
    rating: 4.8,
    reviews: 1500,
    localReviews: [],
    image: 'https://picsum.photos/id/5/600/600',
    description: 'A warm, low-bulk full-zip jacket made of soft, sweater-knit polyester fleece.',
    features: ['100% Recycled Polyester', 'Fair Trade Certified sewn', 'Zippered handwarmer pockets'],
    affiliateLink: '#',
    status: 'published'
  },
  {
    id: 'p6',
    title: 'Yeti Tundra 45 Cooler',
    category: 'Outdoors',
    price: 325.00,
    rating: 4.9,
    reviews: 6700,
    localReviews: [],
    image: 'https://picsum.photos/id/6/600/600',
    description: 'The YETI Tundra 45 combines versatility with durability with a capacity of up to 26 cans with a recommended 2:1 ice-to-contents ratio.',
    features: ['PermaFrost Insulation', 'FatWall Design', 'Rotomolded Construction'],
    affiliateLink: '#',
    isBestSeller: true,
    status: 'published'
  },
  {
    id: 'p7',
    title: 'Bowflex SelectTech 552 Adjustable Dumbbells',
    category: 'Fitness',
    price: 429.00,
    rating: 4.8,
    reviews: 21000,
    localReviews: [],
    image: 'https://picsum.photos/id/7/600/600',
    description: 'Replaces 15 sets of weights. Weights adjust from 5 to 52.5 lbs in 2.5 lb increments up to the first 25 lbs.',
    features: ['Space efficient', 'Quieter workouts', 'Premium grip'],
    affiliateLink: '#',
    status: 'published'
  },
  {
    id: 'p8',
    title: 'Keurig K-Elite Coffee Maker',
    category: 'Home & Kitchen',
    price: 149.00,
    originalPrice: 189.99,
    rating: 4.6,
    reviews: 18000,
    localReviews: [],
    image: 'https://picsum.photos/id/8/600/600',
    description: 'Keurig K-Elite Single Serve Coffee Maker features Strong Brew for when you want to brew a bolder cup of coffee.',
    features: ['Iced setting', 'Hot water on demand', '75oz water reservoir'],
    affiliateLink: '#',
    status: 'published'
  },
  {
    id: 'p9',
    title: 'Garmin Fenix 7 Solar GPS Watch',
    category: 'Fitness',
    price: 799.99,
    rating: 4.7,
    reviews: 980,
    localReviews: [],
    image: 'https://picsum.photos/id/9/600/600',
    description: 'Long-running solar powered multisport GPS watch with scratch-resistant Power Sapphire lens.',
    features: ['Solar charging', 'Touchscreen and buttons', 'Health monitoring'],
    affiliateLink: '#',
    status: 'published'
  },
  {
    id: 'p10',
    title: 'Atomic Habits by James Clear',
    category: 'Books',
    price: 13.79,
    originalPrice: 27.00,
    rating: 4.9,
    reviews: 110000,
    localReviews: [],
    image: 'https://picsum.photos/id/10/600/600',
    description: 'An Easy & Proven Way to Build Good Habits & Break Bad Ones.',
    features: ['Hardcover', 'Self-help', 'New York Times Bestseller'],
    affiliateLink: '#',
    isBestSeller: true,
    status: 'published'
  },
  {
    id: 'p11',
    title: 'Project Hail Mary by Andy Weir',
    category: 'Books',
    price: 16.50,
    rating: 4.8,
    reviews: 65000,
    localReviews: [],
    image: 'https://picsum.photos/id/11/600/600',
    description: 'A lone astronaut must save the earth from disaster in this incredible new science-fiction thriller from the #1 New York Times bestselling author of The Martian.',
    features: ['Science Fiction', 'Paperback', 'Hugo Award Finalist'],
    affiliateLink: '#',
    status: 'published'
  }
];

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 'b1',
    title: 'Top 5 Essentials for Your Home Office',
    excerpt: 'Upgrade your WFH setup with these game-changing gadgets that boost productivity and comfort.',
    content: "Working from home has become the new norm for many, but is your setup actually working for you? We've curated a list of the absolute best products to transform your spare corner into a productivity powerhouse.\n\n### 1. Noise Canceling is Non-Negotiable\nDistractions are the enemy of deep work. That's why we recommend high-quality headphones like the **Sony WH-1000XM5**. They don't just block out sound; they create a sanctuary of silence.\n\n### 2. A Proper Machine\nYou can't code, design, or write effectively on a sluggish machine. The **MacBook Air** with the M2 chip is remarkably fast and silent—perfect for video calls and heavy lifting.\n\n### Summary\nInvesting in your workspace is investing in your career. Start small, but start with quality.",
    author: 'Alex Editor',
    date: 'Oct 15, 2023',
    image: 'https://picsum.photos/id/20/800/400',
    status: 'published',
    linkedProductIds: ['p1', 'p4']
  },
  {
    id: 'b2',
    title: 'The Ultimate Guide to Cordless Cleaning',
    excerpt: 'Say goodbye to tangled wires. We compare top vacuum cleaners to see which one reigns supreme.',
    content: "Cleaning shouldn't feel like a workout. Cordless vacuums have come a long way, and leading the pack is Dyson. In this review, we break down why suction power and battery life matter more than you think.",
    author: 'Sarah Clean',
    date: 'Nov 02, 2023',
    image: 'https://picsum.photos/id/21/800/400',
    status: 'published',
    linkedProductIds: ['p2']
  },
  {
    id: 'b3',
    title: 'Coffee Maker Showdown: Which One Brews the Best Cup?',
    excerpt: 'We tested 5 top-rated coffee makers to find the perfect blend of convenience, flavor, and value.',
    content: `Morning coffee is sacred. It's the ritual that kick-starts your day, and the quality of your brew can make or break your mood. But with so many coffee makers on the market, how do you choose the right one?

### Our Testing Process

We spent two weeks brewing hundreds of cups of coffee using five of the most popular coffee makers available today. We evaluated each model on taste quality, ease of use, brewing time, and overall value.

### Key Factors We Considered

- **Brew Quality**: Does it extract maximum flavor?
- **Speed**: How long does it take to brew a full pot?
- **Ease of Use**: Is it intuitive and user-friendly?
- **Maintenance**: How easy is it to clean?
- **Features**: Does it offer programmability, strength control, etc.?

### The Results Are In

After extensive testing, we've identified clear winners in different categories. Whether you're a casual sipper or a coffee connoisseur, our comparison table below will help you find your perfect match.

Check out our detailed breakdown to see which coffee maker deserves a spot on your counter!`,
    author: 'Coffee Expert',
    date: 'Jan 15, 2024',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=400&fit=crop',
    heroImageUrl: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1600&h=500&fit=crop',
    status: 'published',
    linkedProductIds: ['p8'],
    comparisonTables: [
      {
        id: 'coffee-maker-comparison',
        title: 'Coffee Maker Comparison: Find Your Perfect Brew',
        rowLabels: [
          'Price Range',
          'Brew Time',
          'Carafe Size',
          'Programmable',
          'Grinder Included',
          'Best For'
        ],
        columns: [
          {
            id: 'col-keurig',
            header: 'Keurig K-Elite',
            productId: 'p8',
            highlighted: true,
            values: [
              '$150-$190',
              '1 minute per cup',
              'Single serve',
              'Yes',
              'No',
              'Speed & convenience'
            ]
          },
          {
            id: 'col-ninja',
            header: 'Ninja Specialty',
            values: [
              '$180-$200',
              '8-10 minutes',
              '10 cups',
              'Yes',
              'No',
              'Versatility & specialty drinks'
            ]
          },
          {
            id: 'col-breville',
            header: 'Breville Precision',
            values: [
              '$300-$350',
              '6-8 minutes',
              '12 cups',
              'Yes',
              'No',
              'Precision & consistency'
            ]
          }
        ]
      }
    ]
  }
];

export const INITIAL_SITE_CONTENT: SiteContent = {
  heroTitle: 'Smart Shopping Made Simple.',
  heroSubtitle: 'Discover top-rated products curated by experts and powered by AI. We find the best deals on Amazon so you don\'t have to.',
  heroButtonText: 'Shop Best Sellers',
  themeColor: 'amber',
  season: 'none',
  logoText: 'GoSimpleLiving',
  pageTitle: 'GoSimpleLiving | AI-Curated Amazon Deals & Shopping Guide',
  seoDescription: 'Discover premium AI-curated Amazon affiliate products. Guided by Gemini AI, find the best deals in Electronics, Home, Outdoors, and more with expert reviews.',
  seoKeywords: 'Amazon affiliate, AI shopping, Gemini AI, product curation, GoSimpleLiving, electronics deals, home essentials, smart shopping assistant',
  announcementBar: '🔥 Free Shipping on all orders over $50!',
  footerText: '© 2024 gosimpleliving.com. All rights reserved.',
  heroImageUrl: 'https://picsum.photos/id/1015/1600/900',
  logoUrl: '',
  aiChatEnabled: true,
  uiText: {
    shopNav: 'Shop',
    blogNav: 'Blog',
    pagesNav: 'Pages',
    searchPlaceholder: 'Search products...',
    clearFiltersButton: 'Clear All Filters',
    noProductsTitle: 'No products found',
    noProductsSubtitle: 'Try adjusting your filters or search query.',
    wishlistTitle: 'My Wishlist',
    wishlistEmptyTitle: 'Your wishlist is empty',
    wishlistEmptySubtitle: 'Start browsing to find great deals and add them here.'
  },
  adSenseEnabled: true,
  adSenseClientId: 'ca-pub-1256192896228664',
  showPagesInNav: true, // Show Pages tab by default
  socialLinks: [
    { platform: 'twitter', url: 'https://twitter.com' },
    { platform: 'facebook', url: 'https://facebook.com' }
  ],
  categories: ['Electronics', 'Home & Kitchen', 'Fashion', 'Outdoors', 'Fitness', 'Books'],
  customPages: [
    {
      id: 'page-demo-1',
      slug: 'best-wireless-earbuds-2024',
      title: 'Best Wireless Earbuds 2024: Expert Comparison Guide',
      heroImageUrl: 'https://images.unsplash.com/photo-1590658165737-15a047b1e2f3?w=1600&h=500&fit=crop',
      content: `# Finding the Perfect Wireless Earbuds

Choosing the right wireless earbuds can be overwhelming with so many options on the market. We've tested dozens of models to bring you this comprehensive comparison guide.

## What to Look For

When shopping for wireless earbuds, consider these key factors:

- **Sound Quality**: Look for balanced audio with good bass response
- **Battery Life**: Aim for at least 5-6 hours per charge
- **Noise Cancellation**: Essential for commuters and travelers
- **Comfort**: Proper fit is crucial for long listening sessions
- **Water Resistance**: IPX4 rating minimum for workout use

## Our Top Picks

We've narrowed down the field to three exceptional options that excel in different areas. Check out our detailed comparison table below to see which one matches your needs and budget.

### Why Trust Our Recommendations?

Our team has spent over 100 hours testing these earbuds in real-world conditions - from gym workouts to long flights. We focus on honest, unbiased reviews backed by extensive hands-on experience.`,
      seoInput: 'Best wireless earbuds 2024, noise cancelling earbuds, affordable premium earbuds comparison',
      status: 'published',
      linkedProductIds: ['p1'],
      showInNav: true,
      navOrder: 1,
      comparisonTables: [
        {
          id: 'earbuds-comparison-2024',
          title: 'Premium Wireless Earbuds Comparison 2024',
          rowLabels: [
            'Price',
            'Battery Life',
            'Noise Cancellation',
            'Water Resistance',
            'Codec Support',
            'Warranty'
          ],
          columns: [
            {
              id: 'col-airpods',
              header: 'AirPods Pro 2',
              productId: 'p1',
              highlighted: true,
              values: [
                '$249',
                '6 hours (30 with case)',
                'Excellent - Adaptive',
                'IPX4',
                'AAC',
                '1 Year'
              ]
            },
            {
              id: 'col-sony',
              header: 'Sony WF-1000XM5',
              productId: 'p2',
              values: [
                '$299',
                '8 hours (24 with case)',
                'Outstanding',
                'IPX4',
                'LDAC, AAC, SBC',
                '1 Year'
              ]
            },
            {
              id: 'col-samsung',
              header: 'Galaxy Buds2 Pro',
              productId: 'p3',
              values: [
                '$229',
                '5 hours (18 with case)',
                'Very Good',
                'IPX7',
                'SSC, AAC, SBC',
                '1 Year'
              ]
            }
          ]
        }
      ]
    }
  ]
};
