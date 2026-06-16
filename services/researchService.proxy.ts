
import { TrendingProduct, NicheInsight, MarketingStrategy, ResearchReport } from './researchService';

// Re-export types so consumers don't need to change imports
export type { TrendingProduct, NicheInsight, MarketingStrategy, ResearchReport };

const getProxyUrl = () => {
  const env = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;
  return (env && env.VITE_GEMINI_PROXY_URL) || '/api/gemini-proxy';
};

async function callProxy(action: string, payload?: any): Promise<any> {
  const url = getProxyUrl();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini proxy error: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.result ?? data;
}

const parseJsonFromText = (text: string) => {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
    if (match) {
      try { return JSON.parse(match[1]); } catch { }
    }
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first !== -1 && last !== -1) {
      try { return JSON.parse(text.substring(first, last + 1)); } catch { }
    }
    const firstArr = text.indexOf('[');
    const lastArr = text.lastIndexOf(']');
    if (firstArr !== -1 && lastArr !== -1) {
      try { return JSON.parse(text.substring(firstArr, lastArr + 1)); } catch { }
    }
    return null;
  }
};

export const researchTrendingProducts = async (
  niche: string,
  categories: string[],
  count: number = 8
): Promise<TrendingProduct[]> => {
  const prompt = `You are an expert Amazon affiliate marketing researcher.

Research the current TOP-SELLING and TRENDING products on Amazon for the niche: "${niche}".

Use real-time data to find ${count} products that are currently popular, trending, or best-selling.

For each product provide:
- rank: Position (1-${count})
- name: Exact or close product name
- category: Map to one of: ${categories.join(', ')}
- estimatedPrice: Current approximate price in USD
- whyTrending: 2-3 sentence explanation of why this product is popular right now
- amazonSearchQuery: The best Amazon search query to find this product
- competitionLevel: How saturated the affiliate market is for this product (Low/Medium/High)
- profitPotential: Estimated affiliate earnings potential (Low/Medium/High)
- trendDirection: Whether demand is Rising, Stable, or Declining
- targetAudience: Who buys this product
- affiliateAngle: Best angle to promote this product as an affiliate

Focus on products that:
1. Have high sales volume on Amazon
2. Good review ratings (4+ stars)
3. Are in demand right now
4. Have decent commission potential for affiliates

Return valid JSON array.`;

  const response = await callProxy('researchTrendingProducts', {
    model: 'gemini-3o',
    contents: prompt,
    config: { responseMimeType: 'application/json', tools: [{ googleSearch: {} }] }
  });

  const text = typeof response === 'string' ? response : response?.text || response?.result || JSON.stringify(response);
  const data = parseJsonFromText(text || "[]");
  if (!Array.isArray(data)) return [];

  return data.map((item: any, i: number) => ({
    rank: item.rank || i + 1,
    name: item.name || 'Unknown Product',
    category: item.category || categories[0] || 'General',
    estimatedPrice: typeof item.estimatedPrice === 'number' ? item.estimatedPrice : 0,
    whyTrending: item.whyTrending || '',
    amazonSearchQuery: item.amazonSearchQuery || item.name || '',
    competitionLevel: item.competitionLevel || 'Medium',
    profitPotential: item.profitPotential || 'Medium',
    trendDirection: item.trendDirection || 'Stable',
    targetAudience: item.targetAudience || '',
    affiliateAngle: item.affiliateAngle || '',
  }));
};

export const analyzeNiche = async (niche: string): Promise<NicheInsight> => {
  const prompt = `You are an expert market research analyst specializing in Amazon affiliate marketing.

Perform a deep niche analysis for: "${niche}"

Provide:
- niche: The niche name
- marketSize: Estimated market size (e.g., "$2.5 billion")
- growthRate: Year-over-year growth (e.g., "12% YoY")
- topKeywords: 5-8 high-volume search keywords for this niche
- seasonality: When demand peaks and dips throughout the year
- bestTimeToPromote: The optimal time period to push affiliate content
- contentIdeas: 5-6 blog post / content ideas that would drive traffic
- competitorStrength: How strong the existing affiliate competition is

Use current, real data. Be specific and actionable.

Return valid JSON object.`;

  const response = await callProxy('analyzeNiche', {
    model: 'gemini-3o',
    contents: prompt,
    config: { responseMimeType: 'application/json', tools: [{ googleSearch: {} }] }
  });

  const text = typeof response === 'string' ? response : response?.text || response?.result || JSON.stringify(response);
  const data = parseJsonFromText(text || "{}");
  if (!data) throw new Error("Failed to parse niche analysis.");

  return {
    niche: data.niche || niche,
    marketSize: data.marketSize || 'Unknown',
    growthRate: data.growthRate || 'Unknown',
    topKeywords: Array.isArray(data.topKeywords) ? data.topKeywords : [],
    seasonality: data.seasonality || '',
    bestTimeToPromote: data.bestTimeToPromote || '',
    contentIdeas: Array.isArray(data.contentIdeas) ? data.contentIdeas : [],
    competitorStrength: data.competitorStrength || 'Unknown',
  };
};

export const generateMarketingStrategies = async (
  niche: string,
  productNames: string[]
): Promise<MarketingStrategy[]> => {
  const productContext = productNames.length > 0
    ? `Products to promote: ${productNames.join(', ')}`
    : `Niche: ${niche}`;

  const prompt = `You are a digital marketing strategist specializing in Amazon affiliate marketing.

Generate 5-6 actionable marketing strategies for promoting products in the "${niche}" niche.

${productContext}

For each strategy provide:
- strategyName: Catchy name for the strategy
- platform: Primary platform (e.g., "Blog/SEO", "TikTok", "Pinterest", "YouTube", "Email Marketing", "Instagram Reels", "Reddit")
- difficulty: How hard to execute (Easy/Medium/Hard)
- estimatedROI: Expected return description (e.g., "High — 5-15% conversion rate")
- timeToResults: How long before seeing results (e.g., "2-4 weeks")
- steps: 4-6 actionable steps to implement this strategy
- proTip: One insider tip to maximize results
- budgetRange: Estimated budget needed (e.g., "$0-$50/month" or "$100-$500/month")

Focus on strategies that:
1. Work specifically for Amazon affiliates
2. Are current and relevant
3. Range from beginner-friendly to advanced
4. Include both paid and organic approaches

Return valid JSON array.`;

  const response = await callProxy('generateMarketingStrategies', {
    model: 'gemini-3o',
    contents: prompt,
    config: { responseMimeType: 'application/json', tools: [{ googleSearch: {} }] }
  });

  const text = typeof response === 'string' ? response : response?.text || response?.result || JSON.stringify(response);
  const data = parseJsonFromText(text || "[]");
  if (!Array.isArray(data)) return [];

  return data.map((s: any) => ({
    strategyName: s.strategyName || 'Strategy',
    platform: s.platform || 'Unknown',
    difficulty: s.difficulty || 'Medium',
    estimatedROI: s.estimatedROI || 'Unknown',
    timeToResults: s.timeToResults || 'Unknown',
    steps: Array.isArray(s.steps) ? s.steps : [],
    proTip: s.proTip || '',
    budgetRange: s.budgetRange || 'Unknown',
  }));
};

export const generateFullResearchReport = async (
  niche: string,
  categories: string[]
): Promise<ResearchReport> => {
  const [products, nicheInsight, strategies] = await Promise.all([
    researchTrendingProducts(niche, categories, 8),
    analyzeNiche(niche),
    generateMarketingStrategies(niche, []),
  ]);

  return {
    title: `${niche} — Market Research Report`,
    generatedAt: new Date().toISOString(),
    summary: `Comprehensive analysis of the "${niche}" niche covering ${products.length} trending products, market insights, and ${strategies.length} marketing strategies.`,
    trendingProducts: products,
    nicheInsights: [nicheInsight],
    marketingStrategies: strategies,
    keyTakeaways: [
      `Found ${products.length} trending products in the ${niche} niche`,
      `Market growth: ${nicheInsight.growthRate}`,
      `Best time to promote: ${nicheInsight.bestTimeToPromote}`,
      `Top keyword: ${nicheInsight.topKeywords[0] || 'N/A'}`,
      `${strategies.filter(s => s.difficulty === 'Easy').length} easy-to-implement strategies available`,
    ],
  };
};

export interface CompetitorAnalysis {
  url: string;
  topKeywords: string[];
  linkedProducts: { name: string; amazonQuery: string; estimatedPrice: number }[];
  contentGaps: string[];
  affiliateOpportunities: string[];
  overallStrength: 'Weak' | 'Moderate' | 'Strong';
}

export interface ContentDraftContext {
  query: string;
  products?: TrendingProduct[];
  nicheInsight?: NicheInsight | null;
  strategies?: MarketingStrategy[];
}

export const analyzeCompetitorUrl = async (url: string): Promise<CompetitorAnalysis> => {
  const prompt = `You are a competitive intelligence analyst specializing in Amazon affiliate sites.

Analyze this website: "${url}"

Use Google Search to find and examine the site. Provide:
- topKeywords: 5-8 keywords this site ranks for or targets
- linkedProducts: 3-6 products they promote (name, best Amazon search query, estimated price in USD)
- contentGaps: 4-6 topics/questions this niche needs that this site does not cover well
- affiliateOpportunities: 3-5 specific Amazon product opportunities they are missing
- overallStrength: How strong their affiliate presence is (Weak/Moderate/Strong)

Return valid JSON:
{
  "url": string,
  "topKeywords": string[],
  "linkedProducts": [{"name": string, "amazonQuery": string, "estimatedPrice": number}],
  "contentGaps": string[],
  "affiliateOpportunities": string[],
  "overallStrength": "Weak" | "Moderate" | "Strong"
}`;

  const response = await callProxy('analyzeCompetitorUrl', {
    model: 'gemini-3o',
    contents: prompt,
    config: { responseMimeType: 'application/json', tools: [{ googleSearch: {} }] },
  });

  const text = typeof response === 'string' ? response : response?.text || response?.result || JSON.stringify(response);
  const data = parseJsonFromText(text || '{}');
  if (!data) throw new Error('Failed to analyze competitor URL');

  return {
    url: data.url || url,
    topKeywords: Array.isArray(data.topKeywords) ? data.topKeywords : [],
    linkedProducts: Array.isArray(data.linkedProducts)
      ? data.linkedProducts.map((p: any) => ({
          name: p.name || '',
          amazonQuery: p.amazonQuery || p.name || '',
          estimatedPrice: typeof p.estimatedPrice === 'number' ? p.estimatedPrice : 0,
        }))
      : [],
    contentGaps: Array.isArray(data.contentGaps) ? data.contentGaps : [],
    affiliateOpportunities: Array.isArray(data.affiliateOpportunities) ? data.affiliateOpportunities : [],
    overallStrength: data.overallStrength || 'Moderate',
  };
};

export const generateContentDraft = async (
  type: 'blog' | 'social' | 'email',
  context: ContentDraftContext
): Promise<string> => {
  const productList =
    context.products
      ?.slice(0, 5)
      .map(p => `- ${p.name} (~$${p.estimatedPrice}): ${p.affiliateAngle}`)
      .join('\n') || 'No specific products';

  const prompts: Record<string, string> = {
    blog: `Write a 700-900 word SEO-optimized blog post for the "${context.query}" niche.

Products to feature:
${productList}

Include:
- Catchy H1 title
- Brief intro (2-3 sentences)
- 3-4 H2 sections with practical content
- Natural product recommendations with Amazon search queries in brackets like [search: query here]
- Conclusion with CTA

Write in Markdown. Friendly, helpful tone. No fluff.`,

    social: `Create 3 social media caption variants for the "${context.query}" niche.

Products to feature:
${productList}

Provide:
### TikTok/Reels
(hook + value + CTA, 150-200 chars, relevant hashtags)

### Instagram
(storytelling style, 200-250 chars + hashtags)

### Pinterest
(keyword-rich, 100-150 chars, benefits-focused)`,

    email: `Write an affiliate email newsletter for the "${context.query}" niche.

Products to feature:
${productList}

Include:
**Subject:** (max 60 chars, curiosity-driven)
**Preview:** (max 90 chars)

Email body in Markdown:
- Warm opening (2 sentences)
- Value hook paragraph
- 2-3 product spotlights (name, 1-sentence pitch, [search: query])
- Clear CTA button text
- Friendly sign-off

Keep total body under 300 words.`,
  };

  const response = await callProxy('generateContentDraft', {
    model: 'gemini-3o',
    contents: prompts[type],
  });

  const text = typeof response === 'string' ? response : response?.text || response?.result || '';
  return text || 'Failed to generate content draft.';
};
