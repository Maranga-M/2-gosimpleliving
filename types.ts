import { AffiliateTheme } from './themeConfig';

export type { AffiliateTheme } from './themeConfig';

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Product {
  id: string;
  title: string;
  category: string;
  price: number;
  originalPrice?: number;
  rating: number; // Aggregate Amazon rating
  reviews: number; // Amazon review count
  localReviews?: Review[]; // User submitted reviews on this site
  image: string;
  description: string;
  features: string[];
  affiliateLink: string;
  affiliateLinkLabel?: string;
  affiliateLinkTheme?: AffiliateTheme;
  isBestSeller?: boolean;
  clicks?: number; // Click monitoring
  status: 'draft' | 'pending' | 'published'; // Approval workflow
  regionalPricing?: Record<string, { price: number; currency: string }>; // e.g. { 'UK': { price: 20, currency: 'GBP' } }
  additionalAffiliateLinks?: { label: string; url: string; theme?: AffiliateTheme }[];
  cjAffiliateId?: string; // CJ advertiser ID
  cjDeepLink?: string; // CJ deep link URL
}

export type Category = string;

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
  relatedProductIds?: string[];
}

export type SortOption = 'featured' | 'price-low' | 'price-high' | 'rating';

export type Role = 'admin' | 'user' | 'editor';

export interface User {
  uid: string;
  name: string;
  email: string;
  role: Role;
  wishlist: string[]; // Array of Product IDs
}

export interface Testimonial {
  id: string;
  name: string;
  quote: string;
  rating?: number;
  avatar?: string;
}

export interface ClickBankOffer {
  id: string;
  title: string;
  slug: string;
  headline: string;           // Benefit-focused headline
  subheadline: string;        // Supporting text
  problemStatement: string;   // Pain point awareness
  solutionText: string;       // How product solves it
  heroImageUrl?: string;
  productImageUrl?: string;
  affiliateLink: string;      // ClickBank hoplink
  ctaButtonText: string;      // e.g. "Get Instant Access"
  ctaSecondaryText?: string;  // e.g. "60-Day Money Back Guarantee"
  testimonials: Testimonial[];
  features: string[];
  guaranteeText?: string;
  status: 'draft' | 'published';
  linkedProductIds?: string[]; // Optional linked products
}

export interface CJAffiliate {
  id: string;
  name: string;
  advertiserId: string;       // CJ advertiser ID
  websiteId: string;          // Your CJ website ID (PID)
  deepLinkDomain?: string;    // e.g. "www.anrdoezrs.net" or "www.kqzyfj.com"
  trackingType: 'deep-link' | 'banner' | 'text-link';
  defaultCommission?: number; // Commission percentage
  status: 'active' | 'inactive';
  notes?: string;
}

export interface CJProduct {
  id: string;
  title: string;
  slug: string;
  advertiserId: string;       // CJ advertiser ID
  productUrl: string;         // Original product URL
  deepLink: string;           // Generated CJ deep link
  price: number;
  image?: string;
  description?: string;
  category?: string;
  status: 'draft' | 'published';
}

export type View = 'home' | 'wishlist' | 'dashboard' | 'blog' | 'settings' | 'pages' | 'offers';

export interface SmartCollection {
  id: string;
  name: string;
  productIds: string[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'deal' | 'recommendation' | 'alert';
  relatedProductId?: string;
}

export interface TrackingCode {
  id: string;
  name: string;
  type: 'google-analytics' | 'facebook-pixel' | 'google-tag-manager' | 'tiktok-pixel' | 'custom';
  code: string;
  enabled: boolean;
  placement: 'head' | 'body';
}

export interface AffiliateNetwork {
  id: string;
  name: string; // e.g., "ShareASale", "Impact", "Rakuten", "Amazon Associates"
  enabled: boolean;

  // Network-specific configuration
  publisherId?: string;
  websiteId?: string;
  apiKey?: string;

  // Link generation template
  linkTemplate?: string; // e.g., "https://shareasale.com/r.cfm?b={productId}&u={publisherId}&m={merchantId}"

  // Optional fields
  subId?: string;
  customParams?: Record<string, string>;

  // Metadata
  createdAt?: string;
  updatedAt?: string;
}

export interface AffiliateConfig {
  // Global Toggle
  globalEnabled?: boolean; // Master switch for all affiliate features (defaults to true if undefined)

  // Pinterest
  pinterestVerificationCode?: string;
  pinterestEnabled?: boolean;

  // Google AdSense / Monetization
  adSenseEnabled?: boolean;
  adSenseClientId?: string;

  // CJ Affiliate
  cjPublisherId?: string; // PID
  cjSubId?: string; // Optional sub-tracking ID
  cjEnabled?: boolean;

  // Tracking Codes
  trackingCodes?: TrackingCode[];

  // Other Verification Codes
  googleSiteVerification?: string;
  bingSiteVerification?: string;
  facebookDomainVerification?: string;

  // Affiliate Networks (for multiple provider support)
  affiliateNetworks?: AffiliateNetwork[];
}

export type ThemeColor = 'amber' | 'blue' | 'rose' | 'emerald' | 'indigo' | 'default' | 'orange' | 'red' | 'green' | 'purple';

export type Season =
  | 'none'
  | 'newyear'
  | 'valentine'
  | 'mothers_day'
  | 'fathers_day'
  | 'prime_day'
  | 'singles_day'
  | 'halloween'
  | 'christmas'
  | 'aprilfools';

export interface SiteContent {
  // Marketing Copy
  heroTitle: string;
  heroSubtitle: string;
  heroButtonText: string;

  // Theme & Layout
  themeColor: ThemeColor;
  season?: Season;
  logoText: string;
  pageTitle: string; // Browser tab title
  seoDescription: string; // Meta description
  seoKeywords: string; // Meta keywords
  announcementBar: string;
  footerText: string;
  heroImageUrl: string; // For AI Media Manager
  logoUrl?: string; // Persisted in DB instead of localStorage
  aiChatEnabled?: boolean; // Persisted in DB instead of localStorage
  footerLinks?: { label: string; url: string }[];
  amazonAssociatesId?: string;
  cjWebsiteId?: string; // CJ Publisher ID (PID)
  customPages?: CustomPage[];
  clickBankOffers?: ClickBankOffer[];
  cjAffiliates?: CJAffiliate[]; // CJ affiliate advertisers
  cjProducts?: CJProduct[]; // CJ affiliate products
  sitemapLastUpdated?: string;
  sitemapUrl?: string;
  socialLinks?: SocialLink[];
  showPagesInNav?: boolean; // Toggle to show/hide Pages navigation tab
  showOffersInNav?: boolean; // Toggle to show/hide Offers navigation tab
  showCJProductsInNav?: boolean; // Toggle to show/hide CJ Products navigation tab
  affiliateConfig?: AffiliateConfig; // Affiliate marketing configuration
  categories?: string[]; // Master list of categories

  // AdSense
  adSenseEnabled?: boolean;
  adSenseClientId?: string;

  // UI Text (CMS)
  uiText: {
    shopNav: string;
    blogNav: string;
    pagesNav: string;
    searchPlaceholder: string;
    clearFiltersButton: string;
    noProductsTitle: string;
    noProductsSubtitle: string;
    wishlistTitle: string;
    wishlistEmptyTitle: string;
    wishlistEmptySubtitle: string;
  };
}

export interface ImageAsset {
  id: string;
  url: string;
  prompt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string; // Markdown or HTML
  author: string;
  date: string;
  image: string;
  status: 'draft' | 'pending' | 'published';
  linkedProductIds: string[]; // IDs of products mentioned in the post
  heroImageUrl?: string;
  focusKeyword?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  comparisonTables?: ComparisonTable[];
}

export interface CustomPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  seoInput?: string;
  heroImageUrl?: string;
  status: 'draft' | 'published';
  linkedProductIds?: string[];
  showInNav?: boolean;
  navOrder?: number;
  comparisonTables?: ComparisonTable[];
}

export interface ComparisonTable {
  id: string;
  title: string;
  rowLabels: string[];
  columns: ComparisonTableColumn[];
}

export interface ComparisonTableColumn {
  id: string;
  header: string;
  productId?: string;
  highlighted?: boolean;
  values: string[];
}

export type SocialPlatform = 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'github' | 'youtube' | 'tiktok' | 'pinterest';

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
}

export interface AnalyticsEvent {
  id?: string;
  event_type: 'page_view' | 'click' | 'purchase_intent';
  product_id?: string;
  product_title?: string;
  product_price?: number;
  source: string;
  medium: string;
  campaign: string;
  referrer: string;
  user_agent: string;
  timestamp: string;
}

export type DbProvider = 'supabase';

export interface DbConfig {
  provider: DbProvider;
  supabaseUrl?: string;
  supabaseKey?: string;
}

// CJ Affiliate Types
export interface CJProduct {
  id: string;
  name: string;
  advertiserName: string;
  buyUrl: string;
  price: number;
  imageUrl?: string;
  description?: string;
  category?: string;
  inStock?: boolean;
}

export interface CJLink {
  originalUrl: string;
  affiliateUrl: string;
  publisherId: string;
  subId?: string;
  timestamp: number;
}

// Extend Product interface with CJ fields
export interface ProductWithCJ extends Product {
  cjAdvertiserId?: string;
  cjProductId?: string;
  useCJLink?: boolean;
}

