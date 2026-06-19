
import { dbService } from './database';
import { AnalyticsEvent } from '../types';

interface TrafficSource {
  source: string;
  medium: string;
  campaign: string;
  referrer: string;
  landingPage: string;
  keyword: string | null;
}

const STORAGE_KEY = 'gsl_traffic_source';
const CONVERSION_KEY = 'gsl_pending_conversion';

export const AnalyticsService = {
  /**
   * Captures traffic source from URL parameters and Referrer on app load.
   * Persists this in SessionStorage so we can attribute sales even if they happen pages later.
   */
  init: () => {
    // Check if we already have a session source
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    const urlParams = new URLSearchParams(window.location.search);
    const referrer = document.referrer;

    // Default to 'direct' if no info found
    const sourceData: TrafficSource = {
      source: urlParams.get('utm_source') || (referrer ? new URL(referrer).hostname : 'direct'),
      medium: urlParams.get('utm_medium') || (referrer ? 'referral' : 'none'),
      campaign: urlParams.get('utm_campaign') || 'none',
      referrer: referrer || 'direct',
      landingPage: window.location.pathname,
      keyword: urlParams.get('keyword') ?? null
    };

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sourceData));
    console.log('[Analytics] Session started via:', sourceData.source);
  },

  /**
   * Retrieves the current session's traffic source data.
   */
  getSource: (): TrafficSource => {
     try {
       const stored = sessionStorage.getItem(STORAGE_KEY);
       return stored ? JSON.parse(stored) : {
         source: 'direct', medium: 'none', campaign: 'none', referrer: 'direct', landingPage: '/', keyword: null
       };
     } catch (e) {
       return { source: 'direct', medium: 'none', campaign: 'none', referrer: 'direct', landingPage: '/', keyword: null };
     }
  },

  /**
   * Tracks a specific product click (Outbound Link Click).
   * Sends data to the database for reporting.
   */
  trackProductClick: async (productId: string, productTitle: string, price: number) => {
    const source = AnalyticsService.getSource();
    const now = new Date().toISOString();

    const event: AnalyticsEvent = {
      event_type: 'click',
      product_id: productId,
      product_title: productTitle,
      product_price: price,
      source: source.source,
      medium: source.medium,
      campaign: source.campaign,
      referrer: source.referrer,
      keyword: source.keyword,
      user_agent: navigator.userAgent,
      timestamp: now
    };

    // 1. Log for debugging
    console.log('[Analytics] Outbound Click:', event);

    // 2. Security Check: Detect suspicious rapid clicking to save DB writes
    const clickKey = `last_click_${productId}`;
    const lastClick = parseInt(sessionStorage.getItem(clickKey) || '0');

    if (Date.now() - lastClick < 2000) {
      console.warn('[Security] Rapid clicking detected. Skipping DB log.');
      return;
    }
    sessionStorage.setItem(clickKey, Date.now().toString());

    // 3. Mark pending conversion for attribution
    sessionStorage.setItem(CONVERSION_KEY, JSON.stringify({
      productId,
      productTitle,
      price,
      source: source.source,
      medium: source.medium,
      campaign: source.campaign,
      keyword: source.keyword,
      timestamp: now
    }));

    // 4. Send to Database
    try {
      await dbService.logAnalyticsEvent(event);
    } catch (e) {
      console.error("Failed to log analytics event", e);
    }
  },

  /**
   * Checks for a pending conversion and fires a purchase_intent event.
   * Call this on page load after the user returns from an affiliate site.
   */
  checkPendingConversion: async () => {
    const raw = sessionStorage.getItem(CONVERSION_KEY);
    if (!raw) return;
    try {
      const pending = JSON.parse(raw);
      const source = AnalyticsService.getSource();
      const now = new Date().toISOString();
      const event: AnalyticsEvent = {
        event_type: 'purchase_intent',
        product_id: pending.productId,
        product_title: pending.productTitle,
        product_price: pending.price,
        source: source.source,
        medium: source.medium,
        campaign: source.campaign,
        referrer: source.referrer,
        keyword: source.keyword,
        user_agent: navigator.userAgent,
        timestamp: now
      };
      await dbService.logAnalyticsEvent(event);
      sessionStorage.removeItem(CONVERSION_KEY);
    } catch (e) {
      console.error("Failed to track conversion", e);
    }
  },

  /**
   * Manually fire a purchase_intent event for conversion tracking.
   */
  trackConversion: async (productId: string, productTitle: string, price: number) => {
    const source = AnalyticsService.getSource();
    const now = new Date().toISOString();
    const event: AnalyticsEvent = {
      event_type: 'purchase_intent',
      product_id: productId,
      product_title: productTitle,
      product_price: price,
      source: source.source,
      medium: source.medium,
      campaign: source.campaign,
      referrer: source.referrer,
      keyword: source.keyword,
      user_agent: navigator.userAgent,
      timestamp: now
    };
    sessionStorage.removeItem(CONVERSION_KEY);
    try {
      await dbService.logAnalyticsEvent(event);
    } catch (e) {
      console.error("Failed to track conversion", e);
    }
  },

  /**
   * Tracks a page view event.
   */
  trackPageView: async (path: string) => {
    const source = AnalyticsService.getSource();
    const now = new Date().toISOString();

    const event: AnalyticsEvent = {
      event_type: 'page_view',
      source: source.source,
      medium: source.medium,
      campaign: source.campaign,
      referrer: source.referrer,
      keyword: source.keyword,
      user_agent: navigator.userAgent,
      timestamp: now,
      product_title: path
    };

    console.log('[Analytics] Page View:', path, event);

    try {
      await dbService.logAnalyticsEvent(event);
    } catch (e) {
      console.error("Failed to log page view", e);
    }
  },

  /**
   * Tracks a generic custom event.
   */
  trackEvent: async (eventData: Partial<AnalyticsEvent>) => {
    const source = AnalyticsService.getSource();
    const now = new Date().toISOString();

    const event: AnalyticsEvent = {
      event_type: eventData.event_type || 'click',
      product_id: eventData.product_id,
      product_title: eventData.product_title,
      product_price: eventData.product_price,
      source: eventData.source || source.source,
      medium: eventData.medium || source.medium,
      campaign: eventData.campaign || source.campaign,
      referrer: eventData.referrer || source.referrer,
      keyword: eventData.keyword ?? source.keyword,
      user_agent: navigator.userAgent,
      timestamp: now,
      ...eventData
    };

    console.log('[Analytics] Custom Event:', event);

    try {
      await dbService.logAnalyticsEvent(event);
    } catch (e) {
      console.error("Failed to log custom event", e);
    }
  }
};
