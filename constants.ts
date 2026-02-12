
import { Product, BlogPost, SiteContent } from './types';

// Large static data arrays removed. 
// The application now relies on Supabase and persistent browser caching.

export const PRODUCTS: Product[] = [];
export const BLOG_POSTS: BlogPost[] = [];
export const INITIAL_SITE_CONTENT: SiteContent = {
  heroTitle: '',
  heroSubtitle: '',
  heroButtonText: '',
  themeColor: 'blue',
  logoText: 'GoSimpleLiving',
  pageTitle: 'GoSimpleLiving',
  seoDescription: '',
  seoKeywords: '',
  announcementBar: '',
  footerText: '',
  heroImageUrl: '',
  logoUrl: '',
  aiChatEnabled: true,
  uiText: {
    shopNav: 'Shop',
    blogNav: 'Blog',
    pagesNav: 'Pages',
    searchPlaceholder: 'Search...',
    clearFiltersButton: 'Clear',
    noProductsTitle: 'No products',
    noProductsSubtitle: '',
    wishlistTitle: 'Wishlist',
    wishlistEmptyTitle: 'Empty',
    wishlistEmptySubtitle: ''
  },
  socialLinks: [],
  categories: []
};
