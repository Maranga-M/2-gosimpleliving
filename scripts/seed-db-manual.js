import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Stable UUIDs — so re-running seed always upserts the same rows (idempotent)
const PRODUCTS = [
    {
        id: 'a1b2c3d4-0001-4000-8000-000000000001',
        title: 'Sony WH-1000XM5 Wireless Headphones',
        category: 'Electronics',
        price: 348.00,
        originalPrice: 399.99,
        rating: 4.8,
        reviews: 12500,
        image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        description: 'Industry-leading noise cancellation optimized to you. Multi-Noise Sensor technology. Up to 30-hour battery life with quick charging.',
        features: ['Active Noise Cancellation', '30 Hour Battery', 'Touch Controls', 'Multipoint Connection'],
        affiliateLink: 'https://amazon.com',
        isBestSeller: true,
        status: 'published'
    },
    {
        id: 'a1b2c3d4-0002-4000-8000-000000000002',
        title: 'Nespresso Vertuo Plus Coffee Machine',
        category: 'Home',
        price: 159.00,
        originalPrice: 199.00,
        rating: 4.7,
        reviews: 8900,
        image: 'https://images.unsplash.com/photo-1512568400610-62da28bc8a13?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        description: 'Brew the perfect cup of coffee with a single touch. Versatile brewing sizes: Espresso, Double Espresso, Gran Lungo, Coffee and Alto.',
        features: ['One-Touch Brewing', '5 Cup Sizes', 'Fast Heat Up', 'Automatic Shut-off'],
        affiliateLink: 'https://amazon.com',
        isBestSeller: true,
        status: 'published'
    },
    {
        id: 'a1b2c3d4-0003-4000-8000-000000000003',
        title: 'Instant Pot Duo 7-in-1',
        category: 'Kitchen',
        price: 79.99,
        originalPrice: 99.99,
        rating: 4.9,
        reviews: 150000,
        image: 'https://images.unsplash.com/photo-1546549063-959546d03d32?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        description: "America's most loved multi-cooker, built with the latest 3rd generation technology.",
        features: ['7-in-1 Functionality', 'Dishwasher Safe', 'Safety Features', 'One-Touch Programs'],
        affiliateLink: 'https://amazon.com',
        isBestSeller: false,
        status: 'published'
    },
    {
        id: 'a1b2c3d4-0004-4000-8000-000000000004',
        title: 'Kindle Paperwhite (16 GB)',
        category: 'Electronics',
        price: 139.99,
        originalPrice: 139.99,
        rating: 4.8,
        reviews: 5600,
        image: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        description: 'Now with a 6.8” display and thinner borders, adjustable warm light, up to 10 weeks of battery life.',
        features: ['6.8" Glare-Free Display', 'Adjustable Warm Light', 'Waterproof', 'Weeks of Battery'],
        affiliateLink: 'https://amazon.com',
        isBestSeller: true,
        status: 'published'
    },
    {
        id: 'a1b2c3d4-0005-4000-8000-000000000005',
        title: 'Hydro Flask Wide Mouth Bottle',
        category: 'Outdoors',
        price: 39.95,
        originalPrice: 44.95,
        rating: 4.9,
        reviews: 22000,
        image: 'https://images.unsplash.com/photo-1602143407151-5111978d38bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        description: 'Large enough for a whole day on the river or trails, our 32 oz Wide Mouth Bottle is made with professional-grade stainless steel.',
        features: ['TempShield Insulation', 'BPA-Free', 'Durable Design', 'Lifetime Warranty'],
        affiliateLink: 'https://amazon.com',
        isBestSeller: false,
        status: 'published'
    }
];

const POSTS = [
    {
        id: 'b2c3d4e5-0001-4000-8000-000000000001',
        title: 'The Ultimate Guide to Home Coffee Brewing',
        excerpt: 'Discover the best methods to brew café-quality coffee at home.',
        content: '# The Ultimate Guide to Home Coffee Brewing\n\nBrewing better coffee at home is a journey worth taking. From French press to pour-over, each method produces a unique cup. Start with freshly ground beans for the best flavour.',
        author: 'SimpleLiving Team',
        image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        hero_image_url: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
        status: 'published'
    },
    {
        id: 'b2c3d4e5-0002-4000-8000-000000000002',
        title: 'Top 5 Tech Gadgets of 2024',
        excerpt: 'We review the hottest tech gadgets that are worth your money this year.',
        content: '# Top 5 Tech Gadgets\n\nTechnology moves fast. Here are our top picks for gadgets that genuinely improve your day-to-day life without breaking the bank.',
        author: 'Tech Editor',
        image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        hero_image_url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
        status: 'published'
    },
    {
        id: 'b2c3d4e5-0003-4000-8000-000000000003',
        title: 'Minimalist Living: How to Start',
        excerpt: 'Simple steps to declutter your home and mind.',
        content: '# Minimalist Living\n\nMinimalism is not just about having less stuff — it is about making room for what truly matters. Start with one drawer and go from there.',
        author: 'Lifestyle Guru',
        image: 'https://images.unsplash.com/photo-1484100356142-db6ab6244067?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        hero_image_url: 'https://images.unsplash.com/photo-1484100356142-db6ab6244067?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
        status: 'published'
    }
];

const SITE_CONTENT = {
    id: 'main',
    content: {
        heroTitle: 'Smart Shopping Made Simple.',
        heroSubtitle: 'Discover top-rated products curated by experts.',
        heroButtonText: 'Shop Best Sellers',
        themeColor: 'emerald',
        categories: [],
        uiText: { shopNav: 'Shop', blogNav: 'Blog' }
    }
};

async function seed() {
    console.log("🚀 Starting database push...");

    // Push Products
    console.log("📦 Pushing products...");
    const { error: prodError } = await supabase.from('products').upsert(PRODUCTS, { onConflict: 'id' });
    if (prodError) console.error("❌ Error pushing products:", prodError.message);
    else console.log("✅ Products synced.");

    // Push Posts
    console.log("📝 Pushing posts...");
    const { error: postError } = await supabase.from('posts').upsert(POSTS, { onConflict: 'id' });
    if (postError) console.error("❌ Error pushing posts:", postError.message);
    else console.log("✅ Posts synced.");

    // Push Site Content
    console.log("🌐 Pushing site content...");
    const { error: contentError } = await supabase.from('site_content').upsert(SITE_CONTENT, { onConflict: 'id' });
    if (contentError) console.error("❌ Error pushing site content:", contentError.message);
    else console.log("✅ Site content synced.");

    console.log("✨ Database push complete!");
}

seed();
