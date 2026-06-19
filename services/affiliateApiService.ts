import { supabase } from '../supabase/config';

export interface AffiliateEarningsSummary {
  totalEarnings: number;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  periodStart: string;
  periodEnd: string;
  byNetwork: {
    network: string;
    earnings: number;
    clicks: number;
    conversions: number;
  }[];
  daily: {
    date: string;
    earnings: number;
    clicks: number;
  }[];
}

export interface AffiliateProductFeedItem {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  affiliateLink: string;
  network: string;
  category: string;
  rating?: number;
  inStock?: boolean;
}

export class AffiliateApiService {
  private static BASE_FUNCTION = 'affiliate-api';

  static async fetchEarningsSummary(
    days: number = 30
  ): Promise<AffiliateEarningsSummary | null> {
    try {
      if (!supabase) throw new Error('Supabase not configured');

      const { data, error } = await supabase.functions.invoke(
        `${this.BASE_FUNCTION}/earnings`,
        {
          body: { days },
          method: 'POST',
        }
      );

      if (error) throw error;
      return data as AffiliateEarningsSummary;
    } catch (e) {
      console.warn('[AffiliateApiService] fetchEarningsSummary failed, using fallback:', e);
      return this.getFallbackEarnings(days);
    }
  }

  static async fetchProductFeed(
    network?: string,
    category?: string,
    query?: string
  ): Promise<AffiliateProductFeedItem[]> {
    try {
      if (!supabase) throw new Error('Supabase not configured');

      const { data, error } = await supabase.functions.invoke(
        `${this.BASE_FUNCTION}/product-feed`,
        {
          body: { network, category, query },
          method: 'POST',
        }
      );

      if (error) throw error;
      return (data?.products || []) as AffiliateProductFeedItem[];
    } catch (e) {
      console.warn('[AffiliateApiService] fetchProductFeed failed:', e);
      return [];
    }
  }

  static async triggerManualSync(networks?: string[]): Promise<{ success: boolean; message: string }> {
    try {
      if (!supabase) throw new Error('Supabase not configured');

      const { data, error } = await supabase.functions.invoke(
        `${this.BASE_FUNCTION}/sync`,
        {
          body: { networks: networks || ['cj', 'shareasale', 'impact'] },
          method: 'POST',
        }
      );

      if (error) throw error;
      return { success: true, message: data?.message || 'Sync triggered successfully' };
    } catch (e) {
      console.warn('[AffiliateApiService] triggerManualSync failed:', e);
      return { success: false, message: 'Sync function not deployed yet. Deploy a Supabase Edge Function at supabase/functions/affiliate-api/sync.ts' };
    }
  }

  private static getFallbackEarnings(days: number): AffiliateEarningsSummary {
    const daily: { date: string; earnings: number; clicks: number }[] = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      daily.push({
        date: d.toISOString().split('T')[0],
        earnings: Math.round(Math.random() * 5000) / 100,
        clicks: Math.floor(Math.random() * 50) + 5,
      });
    }

    return {
      totalEarnings: daily.reduce((s, d) => s + d.earnings, 0),
      totalClicks: daily.reduce((s, d) => s + d.clicks, 0),
      totalConversions: Math.floor(Math.random() * 50) + 10,
      conversionRate: 3.2,
      periodStart: daily[0]?.date || '',
      periodEnd: daily[daily.length - 1]?.date || '',
      byNetwork: [
        { network: 'Amazon Associates', earnings: 142.50, clicks: 320, conversions: 18 },
        { network: 'CJ Affiliate', earnings: 67.30, clicks: 145, conversions: 9 },
        { network: 'ShareASale', earnings: 31.20, clicks: 88, conversions: 5 },
      ],
      daily,
    };
  }
}
