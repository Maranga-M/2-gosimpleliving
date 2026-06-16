# Research Tab Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decompose the monolithic `AdminResearch.tsx` into 7 focused sub-components, fix all bugs (broken history tab, wrong model, missing two-phase research), and add four new features: CSV export, AI content drafts, competitor URL analysis, and pinned products.

**Architecture:** The existing `components/admin/AdminResearch.tsx` is replaced by a thin orchestrator at `components/admin/research/index.tsx` that delegates to six panel components. State and API calls live only in the orchestrator; panels receive typed props and emit callbacks. Two new service functions (`analyzeCompetitorUrl`, `generateContentDraft`) and a utility (`researchExport.ts`) are added without touching any other part of the app.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Lucide React, react-hot-toast, existing `callProxy` pattern in `services/researchService.proxy.ts`, Supabase (existing), localStorage (pinned products).

---

## Files Created / Modified

| Action | Path |
|---|---|
| **Modify** | `services/researchService.proxy.ts` |
| **Create** | `services/researchExport.ts` |
| **Create** | `components/admin/research/ResearchHeader.tsx` |
| **Create** | `components/admin/research/TrendingProductsPanel.tsx` |
| **Create** | `components/admin/research/NichePanel.tsx` |
| **Create** | `components/admin/research/StrategiesPanel.tsx` |
| **Create** | `components/admin/research/HistoryPanel.tsx` |
| **Create** | `components/admin/research/CompetitorPanel.tsx` |
| **Create** | `components/admin/research/ContentDraftModal.tsx` |
| **Create** | `components/admin/research/index.tsx` |
| **Modify** | `components/AdminDashboard.tsx` (line 22 — import only) |
| **Delete** | `components/admin/AdminResearch.tsx` |

---

## Task 1: Update researchService.proxy.ts + create researchExport.ts

**Files:**
- Modify: `services/researchService.proxy.ts`
- Create: `services/researchExport.ts`

- [ ] **Step 1: Update model from `gemini-1.5-pro` to `gemini-3o` in all three existing functions**

In `services/researchService.proxy.ts`, find every `model: 'gemini-1.5-pro'` and replace with `model: 'gemini-3o'`. There are three occurrences (in `researchTrendingProducts`, `analyzeNiche`, `generateMarketingStrategies`).

- [ ] **Step 2: Add `CompetitorAnalysis` and `ContentDraftContext` types + two new exported functions**

Append to the bottom of `services/researchService.proxy.ts`:

```typescript
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
```

- [ ] **Step 3: Create `services/researchExport.ts`**

```typescript
import { TrendingProduct, NicheInsight, MarketingStrategy } from './researchService.proxy';

const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

export const exportToCSV = (
  products: TrendingProduct[],
  nicheInsight: NicheInsight | null,
  strategies: MarketingStrategy[],
  query: string
): void => {
  const rows: string[] = [];

  rows.push('NICHE ANALYSIS', 'Field,Value');
  if (nicheInsight) {
    rows.push(
      `Niche,${esc(nicheInsight.niche)}`,
      `Market Size,${esc(nicheInsight.marketSize)}`,
      `Growth Rate,${esc(nicheInsight.growthRate)}`,
      `Competitor Strength,${esc(nicheInsight.competitorStrength)}`,
      `Seasonality,${esc(nicheInsight.seasonality)}`,
      `Best Time to Promote,${esc(nicheInsight.bestTimeToPromote)}`,
      `Top Keywords,${esc(nicheInsight.topKeywords.join('; '))}`,
    );
  }

  rows.push('', 'TRENDING PRODUCTS', 'Rank,Name,Category,Price,Competition,Profit,Trend,Target Audience,Amazon Query');
  products.forEach(p =>
    rows.push(
      `${p.rank},${esc(p.name)},${esc(p.category)},${p.estimatedPrice},${esc(p.competitionLevel)},${esc(p.profitPotential)},${esc(p.trendDirection)},${esc(p.targetAudience)},${esc(p.amazonSearchQuery)}`,
    ),
  );

  rows.push('', 'MARKETING STRATEGIES', 'Strategy,Platform,Difficulty,ROI,Time to Results,Budget');
  strategies.forEach(s =>
    rows.push(
      `${esc(s.strategyName)},${esc(s.platform)},${esc(s.difficulty)},${esc(s.estimatedROI)},${esc(s.timeToResults)},${esc(s.budgetRange)}`,
    ),
  );

  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `research-${query.replace(/\s+/g, '-').toLowerCase()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
```

- [ ] **Step 4: Verify build passes**

```bash
npm run build
```

Expected: no TypeScript errors. If Tailwind/Vite errors appear, they are unrelated to these changes.

- [ ] **Step 5: Commit**

```bash
git add services/researchService.proxy.ts services/researchExport.ts
git commit -m "feat: update research service — gemini-3o, competitor analysis, content draft, CSV export"
```

---

## Task 2: ResearchHeader component

**Files:**
- Create: `components/admin/research/ResearchHeader.tsx`

- [ ] **Step 1: Create the directory and file**

```bash
mkdir -p components/admin/research
```

Create `components/admin/research/ResearchHeader.tsx`:

```tsx
import React, { useState } from 'react';
import { Search, Sparkles, Loader2, Save, Download, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../../Button';

const QUICK_NICHES = [
  '🏠 Smart Home Devices', '🏋️ Home Gym Equipment', '🧴 Skincare & Beauty',
  '👶 Baby Essentials', '🐕 Pet Supplies', '🎮 Gaming Accessories',
  '🌿 Outdoor & Garden', '📱 Phone Accessories', '🍳 Kitchen Gadgets', '📚 Self-Help Books',
];

interface ResearchHeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onResearch: (q?: string) => void;
  isLoading: boolean;
  hasResults: boolean;
  onSave: () => void;
  onExport: () => void;
  onClear: () => void;
  isSaving: boolean;
}

export const ResearchHeader: React.FC<ResearchHeaderProps> = ({
  searchQuery, onSearchChange, onResearch, isLoading, hasResults, onSave, onExport, onClear, isSaving,
}) => {
  const [nichesOpen, setNichesOpen] = useState(true);

  return (
    <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-2xl p-8 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMGg2MHY2MEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wOCkiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IGZpbGw9InVybCgjZykiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiLz48L3N2Zz4=')] opacity-50" />
      <div className="relative z-10 space-y-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold">AI Market Research</h2>
            <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-wider">Powered by Gemini</span>
          </div>
          <p className="text-white/80 text-sm max-w-xl">Research trending Amazon products, analyze niches, and discover winning marketing strategies.</p>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onResearch()}
              placeholder="Enter a niche or category (e.g. 'wireless earbuds', 'home office')..."
              className="w-full pl-12 pr-4 py-3.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all"
            />
          </div>
          <Button onClick={() => onResearch()} disabled={isLoading} className="bg-white text-purple-700 hover:bg-white/90 border-none font-bold px-6 shadow-lg shadow-purple-900/30">
            {isLoading ? <Loader2 size={18} className="animate-spin mr-2" /> : <Sparkles size={18} className="mr-2" />}
            Research
          </Button>
        </div>

        {hasResults && (
          <div className="flex flex-wrap gap-2 pt-1 border-t border-white/20">
            <Button onClick={onSave} disabled={isSaving} variant="outline" className="gap-2 bg-white/10 hover:bg-white/20 text-white border-white/30">
              <Save size={16} />{isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button onClick={onExport} variant="outline" className="gap-2 bg-white/10 hover:bg-white/20 text-white border-white/30">
              <Download size={16} />Export CSV
            </Button>
            <Button onClick={onClear} variant="ghost" className="gap-2 text-white/80 hover:text-white hover:bg-white/10">
              <Trash2 size={16} />Clear
            </Button>
          </div>
        )}

        <div>
          <button
            onClick={() => setNichesOpen(v => !v)}
            className="flex items-center gap-1 text-[11px] font-bold text-white/60 hover:text-white/90 uppercase tracking-wider transition-colors"
          >
            Quick Niches {nichesOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
          {nichesOpen && (
            <div className="flex flex-wrap gap-2 mt-2">
              {QUICK_NICHES.map(n => (
                <button
                  key={n}
                  onClick={() => {
                    const clean = n.replace(/^[^\w]+/, '').trim();
                    onSearchChange(clean);
                    onResearch(clean);
                  }}
                  className="px-3 py-1.5 bg-white/15 hover:bg-white/25 border border-white/20 rounded-lg text-xs font-medium text-white transition-all"
                >
                  {n}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/research/ResearchHeader.tsx
git commit -m "feat: add ResearchHeader component"
```

---

## Task 3: TrendingProductsPanel component

**Files:**
- Create: `components/admin/research/TrendingProductsPanel.tsx`

- [ ] **Step 1: Create the file**

```tsx
import React from 'react';
import { Copy, ExternalLink, ShoppingCart, Star, Sparkles, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { TrendingProduct } from '../../../services/researchService.proxy';

const DifficultyBadge: React.FC<{ level: string }> = ({ level }) => {
  const colors: Record<string, string> = {
    Low: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    Easy: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    Medium: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    High: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
    Hard: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
  };
  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${colors[level] || colors.Medium}`}>
      {level}
    </span>
  );
};

const TrendBadge: React.FC<{ direction: string }> = ({ direction }) => {
  const colors: Record<string, string> = {
    Rising: 'text-emerald-600 dark:text-emerald-400',
    Stable: 'text-blue-600 dark:text-blue-400',
    Declining: 'text-red-600 dark:text-red-400',
  };
  const icons: Record<string, string> = { Rising: '📈', Stable: '📊', Declining: '📉' };
  return (
    <span className={`flex items-center gap-1 text-xs font-bold ${colors[direction] || ''}`}>
      {icons[direction] || '📊'} {direction}
    </span>
  );
};

interface TrendingProductsPanelProps {
  products: TrendingProduct[];
  pinnedIds: Set<string>;
  onPin: (product: TrendingProduct) => void;
  onAddToProduct: ((product: { name: string; category: string; price: number; searchQuery: string }) => void) | undefined;
  onDraftContent: () => void;
}

export const TrendingProductsPanel: React.FC<TrendingProductsPanelProps> = ({
  products, pinnedIds, onPin, onAddToProduct, onDraftContent,
}) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <ShoppingCart size={40} className="mx-auto mb-3 opacity-30" />
        <p className="font-medium">No products found. Try a different niche.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={onDraftContent} className="flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 transition-colors">
          <Sparkles size={14} />Draft Blog Post from These Products
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map((p, i) => {
          const isPinned = pinnedIds.has(p.name);
          return (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-700 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm">#{p.rank}</span>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight truncate">{p.name}</h4>
                </div>
                <TrendBadge direction={p.trendDirection} />
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">{p.whyTrending}</p>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Price</p>
                  <p className="text-sm font-bold text-emerald-600">${p.estimatedPrice}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Competition</p>
                  <DifficultyBadge level={p.competitionLevel} />
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Profit</p>
                  <DifficultyBadge level={p.profitPotential} />
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2.5 mb-3">
                <p className="text-[10px] font-bold text-purple-500 uppercase mb-1">💡 Affiliate Angle</p>
                <p className="text-xs text-purple-700 dark:text-purple-300">{p.affiliateAngle}</p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Users size={12} className="text-slate-400 shrink-0" />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 flex-1 min-w-0 truncate">{p.targetAudience}</p>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => onPin(p)}
                    className={`p-1.5 rounded-lg transition-colors ${isPinned ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/30' : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30'}`}
                    title={isPinned ? 'Unpin' : 'Pin product'}
                  >
                    <Star size={14} fill={isPinned ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={() => { navigator.clipboard.writeText(p.amazonSearchQuery); toast.success('Copied!'); }}
                    className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                    title="Copy Amazon search query"
                  >
                    <Copy size={14} />
                  </button>
                  <a
                    href={`https://www.amazon.com/s?k=${encodeURIComponent(p.amazonSearchQuery)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                    title="Search on Amazon"
                  >
                    <ExternalLink size={14} />
                  </a>
                  {onAddToProduct && (
                    <button
                      onClick={() => {
                        onAddToProduct({ name: p.name, category: p.category, price: p.estimatedPrice, searchQuery: p.amazonSearchQuery });
                        toast.success(`"${p.name}" added as draft!`);
                      }}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                      title="Add as draft product"
                    >
                      <ShoppingCart size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/research/TrendingProductsPanel.tsx
git commit -m "feat: add TrendingProductsPanel with pin, copy, Amazon link, add-to-catalogue"
```

---

## Task 4: NichePanel + StrategiesPanel

**Files:**
- Create: `components/admin/research/NichePanel.tsx`
- Create: `components/admin/research/StrategiesPanel.tsx`

- [ ] **Step 1: Create `components/admin/research/NichePanel.tsx`**

```tsx
import React from 'react';
import { BarChart3, DollarSign, TrendingUp, Target, Search, Zap, Lightbulb, ArrowRight, Sparkles } from 'lucide-react';
import { NicheInsight } from '../../../services/researchService.proxy';

interface NichePanelProps {
  nicheInsight: NicheInsight | null;
  onDraftContent: () => void;
}

export const NichePanel: React.FC<NichePanelProps> = ({ nicheInsight, onDraftContent }) => {
  if (!nicheInsight) {
    return (
      <div className="text-center py-12 text-slate-400">
        <BarChart3 size={40} className="mx-auto mb-3 opacity-30" />
        <p className="font-medium">No niche data available. Try researching again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={onDraftContent} className="flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 transition-colors">
          <Sparkles size={14} />Draft Content from Niche Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
              <DollarSign size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Market Size</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{nicheInsight.marketSize}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <TrendingUp size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Growth Rate</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{nicheInsight.growthRate}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <Target size={18} className="text-purple-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Competition</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{nicheInsight.competitorStrength}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-3 flex items-center gap-2">
            <Search size={16} className="text-purple-500" />Top Keywords
          </h4>
          <div className="flex flex-wrap gap-2">
            {nicheInsight.topKeywords.map((kw, i) => (
              <span key={i} className="px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-medium border border-purple-100 dark:border-purple-800">
                {kw}
              </span>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-2 flex items-center gap-2">
            <Zap size={16} className="text-amber-500" />Seasonality
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{nicheInsight.seasonality}</p>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
            <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">Best Time to Promote</p>
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">{nicheInsight.bestTimeToPromote}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
        <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-3 flex items-center gap-2">
          <Lightbulb size={16} className="text-amber-500" />Content Ideas
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {nicheInsight.contentIdeas.map((idea, i) => (
            <div key={i} className="flex items-start gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <ArrowRight size={14} className="text-purple-500 mt-0.5 shrink-0" />
              <p className="text-sm text-slate-700 dark:text-slate-300">{idea}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Create `components/admin/research/StrategiesPanel.tsx`**

```tsx
import React from 'react';
import { ChevronDown, ChevronUp, Megaphone, Sparkles } from 'lucide-react';
import { MarketingStrategy } from '../../../services/researchService.proxy';

const DifficultyBadge: React.FC<{ level: string }> = ({ level }) => {
  const colors: Record<string, string> = {
    Easy: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    Medium: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    Hard: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
  };
  return (
    <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full border ${colors[level] || colors.Medium}`}>
      {level}
    </span>
  );
};

interface StrategiesPanelProps {
  strategies: MarketingStrategy[];
  expandedIndex: number | null;
  onToggle: (i: number) => void;
  onDraftContent: () => void;
}

export const StrategiesPanel: React.FC<StrategiesPanelProps> = ({ strategies, expandedIndex, onToggle, onDraftContent }) => {
  if (strategies.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Megaphone size={40} className="mx-auto mb-3 opacity-30" />
        <p className="font-medium">No strategies found. Try researching again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={onDraftContent} className="flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 transition-colors">
          <Sparkles size={14} />Draft Email from Strategies
        </button>
      </div>
      {strategies.map((s, i) => (
        <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all hover:shadow-md">
          <button onClick={() => onToggle(i)} className="w-full flex items-center justify-between p-5 text-left">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                {i + 1}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">{s.strategyName}</h4>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-[11px] text-slate-500 font-medium">{s.platform}</span>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <DifficultyBadge level={s.difficulty} />
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span className="text-[11px] text-slate-500">{s.budgetRange}</span>
                </div>
              </div>
            </div>
            {expandedIndex === i ? <ChevronUp size={18} className="text-slate-400 shrink-0" /> : <ChevronDown size={18} className="text-slate-400 shrink-0" />}
          </button>

          {expandedIndex === i && (
            <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 pt-4 animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Expected ROI</p>
                  <p className="text-sm font-bold text-emerald-600 mt-1">{s.estimatedROI}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Time to Results</p>
                  <p className="text-sm font-bold text-blue-600 mt-1">{s.timeToResults}</p>
                </div>
              </div>

              <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Implementation Steps</h5>
              <ol className="space-y-2 mb-4">
                {s.steps.map((step, si) => (
                  <li key={si} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {si + 1}
                    </span>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{step}</p>
                  </li>
                ))}
              </ol>

              {s.proTip && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
                  <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">💡 Pro Tip</p>
                  <p className="text-sm text-amber-800 dark:text-amber-300">{s.proTip}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
```

- [ ] **Step 3: Commit**

```bash
git add components/admin/research/NichePanel.tsx components/admin/research/StrategiesPanel.tsx
git commit -m "feat: add NichePanel and StrategiesPanel components"
```

---

## Task 5: HistoryPanel component

**Files:**
- Create: `components/admin/research/HistoryPanel.tsx`

- [ ] **Step 1: Create the file**

```tsx
import React, { useState } from 'react';
import { Database, Star, Trash2, FolderOpen, Clock, StarOff } from 'lucide-react';
import { TrendingProduct, NicheInsight, MarketingStrategy } from '../../../services/researchService.proxy';

export interface SavedResearch {
  id: string;
  query: string;
  createdAt: string;
  products: TrendingProduct[];
  nicheInsight: NicheInsight | null;
  strategies: MarketingStrategy[];
}

export interface PinnedProduct extends TrendingProduct {
  pinnedAt: string;
  sourceQuery: string;
}

interface HistoryPanelProps {
  savedResearch: SavedResearch[];
  pinnedProducts: PinnedProduct[];
  isLoadingHistory: boolean;
  onLoad: (research: SavedResearch) => void;
  onDelete: (id: string) => void;
  onUnpin: (productName: string) => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  savedResearch, pinnedProducts, isLoadingHistory, onLoad, onDelete, onUnpin,
}) => {
  const [subTab, setSubTab] = useState<'saved' | 'pinned'>('saved');

  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-fit">
        <button
          onClick={() => setSubTab('saved')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${subTab === 'saved' ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <Database size={15} />Saved
          {savedResearch.length > 0 && <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full text-[10px] font-bold">{savedResearch.length}</span>}
        </button>
        <button
          onClick={() => setSubTab('pinned')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${subTab === 'pinned' ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <Star size={15} />Pinned
          {pinnedProducts.length > 0 && <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full text-[10px] font-bold">{pinnedProducts.length}</span>}
        </button>
      </div>

      {subTab === 'saved' && (
        <>
          {isLoadingHistory ? (
            <div className="text-center py-8 text-slate-400 text-sm">Loading history...</div>
          ) : savedResearch.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Database size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No saved research yet.</p>
              <p className="text-sm mt-1">Run a search and click Save to keep results here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedResearch.map(r => (
                <div key={r.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{r.query}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock size={11} />{new Date(r.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-[11px] text-slate-400">{r.products.length} products · {r.strategies.length} strategies</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => onLoad(r)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-lg transition-colors"
                    >
                      <FolderOpen size={13} />Load
                    </button>
                    <button
                      onClick={() => onDelete(r.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {subTab === 'pinned' && (
        <>
          {pinnedProducts.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Star size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No pinned products yet.</p>
              <p className="text-sm mt-1">Click the ★ on any product card to pin it here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pinnedProducts.map((p, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{p.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[11px] text-slate-400">${p.estimatedPrice} · {p.competitionLevel} competition</span>
                      <span className="text-[11px] text-purple-500 truncate">from "{p.sourceQuery}"</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <a
                      href={`https://www.amazon.com/s?k=${encodeURIComponent(p.amazonSearchQuery)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 rounded-lg transition-colors"
                    >
                      Amazon →
                    </a>
                    <button
                      onClick={() => onUnpin(p.name)}
                      className="p-1.5 text-amber-400 hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title="Unpin"
                    >
                      <StarOff size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/research/HistoryPanel.tsx
git commit -m "feat: add HistoryPanel with saved research + pinned products sub-tabs"
```

---

## Task 6: CompetitorPanel component

**Files:**
- Create: `components/admin/research/CompetitorPanel.tsx`

- [ ] **Step 1: Create the file**

```tsx
import React, { useState } from 'react';
import { Search, Loader2, Globe, Tag, ShoppingBag, Lightbulb, TrendingUp, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../../Button';
import { CompetitorAnalysis, analyzeCompetitorUrl } from '../../../services/researchService.proxy';

const STRENGTH_COLORS: Record<string, string> = {
  Weak: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  Moderate: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  Strong: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
};

export const CompetitorPanel: React.FC = () => {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<CompetitorAnalysis | null>(null);

  const handleAnalyze = async () => {
    const trimmed = url.trim();
    if (!trimmed) { toast.error('Enter a competitor URL'); return; }
    setIsAnalyzing(true);
    setResult(null);
    try {
      const analysis = await analyzeCompetitorUrl(trimmed);
      setResult(analysis);
      toast.success('Competitor analysis complete!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to analyze URL');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
          <Globe size={18} className="text-purple-500" />Competitor URL Analysis
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Paste a competitor affiliate blog URL to reveal their keywords, products, and content gaps you can exploit.
        </p>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
              placeholder="https://competitor-blog.com/best-wireless-earbuds"
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>
          <Button onClick={handleAnalyze} disabled={isAnalyzing} className="shrink-0">
            {isAnalyzing && <Loader2 size={16} className="animate-spin mr-2" />}
            {isAnalyzing ? 'Analyzing...' : 'Analyze'}
          </Button>
        </div>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-sm text-purple-600 hover:underline flex items-center gap-1 truncate max-w-md">
              <ExternalLink size={13} />{result.url}
            </a>
            <span className={`px-3 py-1 text-xs font-bold rounded-full border ${STRENGTH_COLORS[result.overallStrength] || STRENGTH_COLORS.Moderate}`}>
              {result.overallStrength} Competition
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-3 flex items-center gap-2">
                <Tag size={15} className="text-purple-500" />Their Top Keywords
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.topKeywords.map((kw, i) => (
                  <span key={i} className="px-2.5 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-medium border border-purple-100 dark:border-purple-800">
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-3 flex items-center gap-2">
                <ShoppingBag size={15} className="text-indigo-500" />Products They Promote
              </h4>
              <div className="space-y-2">
                {result.linkedProducts.map((p, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{p.name}</span>
                    <a
                      href={`https://www.amazon.com/s?k=${encodeURIComponent(p.amazonQuery)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-purple-500 hover:underline shrink-0"
                    >
                      ~${p.estimatedPrice} →
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-3 flex items-center gap-2">
                <Lightbulb size={15} className="text-amber-500" />Content Gaps
              </h4>
              <ul className="space-y-2">
                {result.contentGaps.map((gap, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <span className="text-amber-500 mt-0.5 shrink-0">→</span>{gap}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-3 flex items-center gap-2">
                <TrendingUp size={15} className="text-emerald-500" />Affiliate Opportunities
              </h4>
              <ul className="space-y-2">
                {result.affiliateOpportunities.map((opp, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <span className="text-emerald-500 mt-0.5 shrink-0">★</span>{opp}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/research/CompetitorPanel.tsx
git commit -m "feat: add CompetitorPanel with URL analysis and gap detection"
```

---

## Task 7: ContentDraftModal component

**Files:**
- Create: `components/admin/research/ContentDraftModal.tsx`

- [ ] **Step 1: Create the file**

```tsx
import React, { useState } from 'react';
import { X, Loader2, Copy, FileText, MessageSquare, Mail, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../../Button';
import { ContentDraftContext, generateContentDraft } from '../../../services/researchService.proxy';

type DraftType = 'blog' | 'social' | 'email';

const DRAFT_TYPES: { key: DraftType; label: string; icon: React.ElementType; description: string }[] = [
  { key: 'blog', label: 'Blog Post', icon: FileText, description: '700-900 word SEO post with product links' },
  { key: 'social', label: 'Social Captions', icon: MessageSquare, description: 'TikTok, Instagram & Pinterest variants' },
  { key: 'email', label: 'Email Newsletter', icon: Mail, description: 'Subject line + affiliate email body' },
];

interface ContentDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: ContentDraftContext;
  onAddAsBlogPost?: (content: string, title: string) => void;
}

export const ContentDraftModal: React.FC<ContentDraftModalProps> = ({ isOpen, onClose, context, onAddAsBlogPost }) => {
  const [selectedType, setSelectedType] = useState<DraftType>('blog');
  const [isGenerating, setIsGenerating] = useState(false);
  const [draft, setDraft] = useState('');

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setDraft('');
    try {
      const content = await generateContentDraft(selectedType, context);
      setDraft(content);
      toast.success('Content draft generated!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate draft');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTypeChange = (type: DraftType) => {
    setSelectedType(type);
    setDraft('');
  };

  const extractTitle = (md: string): string => {
    const match = md.match(/^#\s+(.+)/m);
    return match ? match[1] : context.query;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles size={20} className="text-purple-500 shrink-0" />
            <h2 className="font-bold text-slate-900 dark:text-white">Draft Content</h2>
            <span className="text-sm text-slate-500 truncate">for "{context.query}"</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-3 gap-2">
            {DRAFT_TYPES.map(({ key, label, icon: Icon, description }) => (
              <button
                key={key}
                onClick={() => handleTypeChange(key)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all ${selectedType === key ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700'}`}
              >
                <Icon size={18} className={selectedType === key ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'} />
                <span className={`text-xs font-bold ${selectedType === key ? 'text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-400'}`}>{label}</span>
                <span className="text-[10px] text-slate-400 leading-tight">{description}</span>
              </button>
            ))}
          </div>

          <Button onClick={handleGenerate} disabled={isGenerating} className="w-full gap-2">
            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {isGenerating ? 'Generating...' : `Generate ${DRAFT_TYPES.find(t => t.key === selectedType)?.label}`}
          </Button>

          {draft && (
            <div className="space-y-3">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 max-h-72 overflow-y-auto">
                <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">{draft}</pre>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => { navigator.clipboard.writeText(draft); toast.success('Copied!'); }}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  <Copy size={15} />Copy to Clipboard
                </Button>
                {selectedType === 'blog' && onAddAsBlogPost && (
                  <Button
                    onClick={() => { onAddAsBlogPost(draft, extractTitle(draft)); onClose(); toast.success('Added as blog post draft!'); }}
                    className="flex-1 gap-2"
                  >
                    <FileText size={15} />Add as Blog Post
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/research/ContentDraftModal.tsx
git commit -m "feat: add ContentDraftModal for blog, social, and email content generation"
```

---

## Task 8: Main orchestrator (index.tsx)

**Files:**
- Create: `components/admin/research/index.tsx`

- [ ] **Step 1: Create the file**

```tsx
import React, { useState, useCallback, useEffect } from 'react';
import { ShoppingCart, BarChart3, Megaphone, Database, Globe, Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../../Button';
import {
  TrendingProduct, NicheInsight, MarketingStrategy,
  researchTrendingProducts, analyzeNiche, generateMarketingStrategies,
  ContentDraftContext,
} from '../../../services/researchService.proxy';
import { exportToCSV } from '../../../services/researchExport';
import { ResearchHeader } from './ResearchHeader';
import { TrendingProductsPanel } from './TrendingProductsPanel';
import { NichePanel } from './NichePanel';
import { StrategiesPanel } from './StrategiesPanel';
import { HistoryPanel, SavedResearch, PinnedProduct } from './HistoryPanel';
import { CompetitorPanel } from './CompetitorPanel';
import { ContentDraftModal } from './ContentDraftModal';

type ActiveSection = 'products' | 'niche' | 'strategies' | 'history' | 'competitor';

const PINNED_KEY = 'gsl_pinned_products';
const MAX_PINNED = 50;

const loadPinned = (): PinnedProduct[] => {
  try { return JSON.parse(localStorage.getItem(PINNED_KEY) || '[]'); } catch { return []; }
};

const savePinned = (products: PinnedProduct[]): void => {
  try { localStorage.setItem(PINNED_KEY, JSON.stringify(products)); } catch {}
};

interface AdminResearchProps {
  categories: string[];
  onAddProductFromResearch?: (product: { name: string; category: string; price: number; searchQuery: string }) => void;
  onAddBlogPost?: (content: string, title: string) => void;
}

export const AdminResearch: React.FC<AdminResearchProps> = ({ categories, onAddProductFromResearch, onAddBlogPost }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [lastQuery, setLastQuery] = useState('');
  const [isLoadingPhase1, setIsLoadingPhase1] = useState(false);
  const [isLoadingPhase2, setIsLoadingPhase2] = useState(false);
  const [activeSection, setActiveSection] = useState<ActiveSection>('products');

  const [products, setProducts] = useState<TrendingProduct[]>([]);
  const [nicheInsight, setNicheInsight] = useState<NicheInsight | null>(null);
  const [strategies, setStrategies] = useState<MarketingStrategy[]>([]);
  const [expandedStrategy, setExpandedStrategy] = useState<number | null>(null);

  const [savedResearch, setSavedResearch] = useState<SavedResearch[]>([]);
  const [pinnedProducts, setPinnedProducts] = useState<PinnedProduct[]>(loadPinned);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [isContentDraftOpen, setIsContentDraftOpen] = useState(false);
  const [contentDraftContext, setContentDraftContext] = useState<ContentDraftContext | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const { dbService } = await import('../../../services/database');
        const history = await dbService.getResearchHistory?.() || [];
        setSavedResearch(history as SavedResearch[]);
      } catch (e) {
        console.warn('Could not load research history:', e);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    loadHistory();
  }, []);

  const handleResearch = useCallback(async (query?: string) => {
    const q = (query || searchQuery).trim();
    if (!q) { toast.error('Enter a niche or category'); return; }

    setLastQuery(q);
    setProducts([]);
    setNicheInsight(null);
    setStrategies([]);
    setActiveSection('products');
    setExpandedStrategy(null);

    // Phase 1: products + niche in parallel
    setIsLoadingPhase1(true);
    let resolvedProducts: TrendingProduct[] = [];
    try {
      const [prods, insight] = await Promise.allSettled([
        researchTrendingProducts(q, categories, 8),
        analyzeNiche(q),
      ]);
      if (prods.status === 'fulfilled') { resolvedProducts = prods.value; setProducts(prods.value); }
      if (insight.status === 'fulfilled') setNicheInsight(insight.value);
    } finally {
      setIsLoadingPhase1(false);
    }

    // Phase 2: strategies with real product names
    setIsLoadingPhase2(true);
    try {
      const productNames = resolvedProducts.slice(0, 5).map(p => p.name);
      const strats = await generateMarketingStrategies(q, productNames);
      setStrategies(strats);
      toast.success(`Research complete for "${q}"!`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate strategies.');
    } finally {
      setIsLoadingPhase2(false);
    }
  }, [searchQuery, categories]);

  const handleSave = async () => {
    if (!lastQuery || (products.length === 0 && !nicheInsight && strategies.length === 0)) {
      toast.error('No results to save.');
      return;
    }
    setIsSaving(true);
    try {
      const { dbService } = await import('../../../services/database');
      await dbService.saveResearch?.({ query: lastQuery, products, nicheInsight, strategies, createdAt: new Date().toISOString() });
      toast.success('Saved!');
      const history = await dbService.getResearchHistory?.() || [];
      setSavedResearch(history as SavedResearch[]);
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    if (!lastQuery) { toast.error('Nothing to export'); return; }
    exportToCSV(products, nicheInsight, strategies, lastQuery);
    toast.success('CSV downloaded!');
  };

  const handleClear = () => {
    setProducts([]); setNicheInsight(null); setStrategies([]);
    setLastQuery(''); setSearchQuery(''); setActiveSection('products'); setExpandedStrategy(null);
  };

  const handleLoadSaved = (research: SavedResearch) => {
    setSearchQuery(research.query); setLastQuery(research.query);
    setProducts(research.products); setNicheInsight(research.nicheInsight); setStrategies(research.strategies);
    setActiveSection('products');
    toast.success(`Loaded "${research.query}"`);
  };

  const handleDeleteSaved = async (id: string) => {
    if (!confirm('Delete this saved research?')) return;
    try {
      const { dbService } = await import('../../../services/database');
      await dbService.deleteResearch?.(id);
      const history = await dbService.getResearchHistory?.() || [];
      setSavedResearch(history as SavedResearch[]);
      toast.success('Deleted');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete');
    }
  };

  const handleTogglePin = (product: TrendingProduct) => {
    setPinnedProducts(prev => {
      const exists = prev.some(p => p.name === product.name);
      const updated: PinnedProduct[] = exists
        ? prev.filter(p => p.name !== product.name)
        : [{ ...product, pinnedAt: new Date().toISOString(), sourceQuery: lastQuery }, ...prev].slice(0, MAX_PINNED);
      savePinned(updated);
      toast.success(exists ? 'Unpinned' : 'Pinned!');
      return updated;
    });
  };

  const handleUnpin = (productName: string) => {
    setPinnedProducts(prev => {
      const updated = prev.filter(p => p.name !== productName);
      savePinned(updated);
      return updated;
    });
    toast.success('Unpinned');
  };

  const openDraft = (context: ContentDraftContext) => {
    setContentDraftContext(context);
    setIsContentDraftOpen(true);
  };

  const isLoading = isLoadingPhase1 || isLoadingPhase2;
  const hasResults = !!(lastQuery && (products.length > 0 || nicheInsight || strategies.length > 0));
  const pinnedIds = new Set(pinnedProducts.map(p => p.name));
  const draftContext: ContentDraftContext = { query: lastQuery, products, nicheInsight, strategies };

  const TABS: { key: ActiveSection; label: string; icon: React.ElementType; count?: number }[] = [
    { key: 'products', label: 'Trending Products', icon: ShoppingCart, count: products.length },
    { key: 'niche', label: 'Niche Analysis', icon: BarChart3, count: nicheInsight ? 1 : 0 },
    { key: 'strategies', label: 'Strategies', icon: Megaphone, count: strategies.length },
    { key: 'history', label: 'History', icon: Database, count: savedResearch.length + pinnedProducts.length },
    { key: 'competitor', label: 'Competitor', icon: Globe },
  ];

  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      <ResearchHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onResearch={handleResearch}
        isLoading={isLoading}
        hasResults={hasResults}
        onSave={handleSave}
        onExport={handleExport}
        onClear={handleClear}
        isSaving={isSaving}
      />

      {/* Tabs — always visible */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-fit flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeSection === tab.key ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-[10px] font-bold">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Phase 1 loading */}
      {isLoadingPhase1 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 rounded-full border-4 border-purple-200 dark:border-purple-900 border-t-purple-600 animate-spin" />
          <div className="text-center">
            <p className="font-bold text-slate-900 dark:text-white">Researching "{lastQuery}"...</p>
            <p className="text-sm text-slate-500">Finding trending products and analyzing the niche</p>
          </div>
        </div>
      )}

      {/* Phase 2 loading banner */}
      {!isLoadingPhase1 && isLoadingPhase2 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
          <Loader2 size={16} className="text-purple-600 animate-spin shrink-0" />
          <span className="text-sm text-purple-700 dark:text-purple-300">Generating context-aware marketing strategies...</span>
        </div>
      )}

      {/* Panels */}
      {!isLoadingPhase1 && (
        <>
          {activeSection === 'products' && (
            <TrendingProductsPanel
              products={products}
              pinnedIds={pinnedIds}
              onPin={handleTogglePin}
              onAddToProduct={onAddProductFromResearch}
              onDraftContent={() => openDraft(draftContext)}
            />
          )}
          {activeSection === 'niche' && (
            <NichePanel nicheInsight={nicheInsight} onDraftContent={() => openDraft(draftContext)} />
          )}
          {activeSection === 'strategies' && (
            <StrategiesPanel
              strategies={strategies}
              expandedIndex={expandedStrategy}
              onToggle={i => setExpandedStrategy(expandedStrategy === i ? null : i)}
              onDraftContent={() => openDraft(draftContext)}
            />
          )}
          {activeSection === 'history' && (
            <HistoryPanel
              savedResearch={savedResearch}
              pinnedProducts={pinnedProducts}
              isLoadingHistory={isLoadingHistory}
              onLoad={handleLoadSaved}
              onDelete={handleDeleteSaved}
              onUnpin={handleUnpin}
            />
          )}
          {activeSection === 'competitor' && <CompetitorPanel />}
        </>
      )}

      {/* Re-run */}
      {!isLoading && lastQuery && activeSection !== 'history' && activeSection !== 'competitor' && (
        <div className="flex justify-center pt-2">
          <Button onClick={() => handleResearch(lastQuery)} variant="ghost" className="gap-2 text-slate-500">
            <RefreshCw size={15} />Re-run for "{lastQuery}"
          </Button>
        </div>
      )}

      {contentDraftContext && (
        <ContentDraftModal
          isOpen={isContentDraftOpen}
          onClose={() => setIsContentDraftOpen(false)}
          context={contentDraftContext}
          onAddAsBlogPost={onAddBlogPost}
        />
      )}
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/research/index.tsx
git commit -m "feat: add research orchestrator index.tsx with two-phase loading and full feature wiring"
```

---

## Task 9: Wire up AdminDashboard + cleanup

**Files:**
- Modify: `components/AdminDashboard.tsx` line 22
- Delete: `components/admin/AdminResearch.tsx`

- [ ] **Step 1: Update the import in `components/AdminDashboard.tsx`**

Change line 22 from:
```typescript
import { AdminResearch } from './admin/AdminResearch';
```
to:
```typescript
import { AdminResearch } from './admin/research';
```

- [ ] **Step 2: Delete the old monolithic component**

```bash
rm components/admin/AdminResearch.tsx
```

- [ ] **Step 3: Run the build to verify no TypeScript errors**

```bash
npm run build
```

Expected: build succeeds. If TypeScript complains about a missing type that was only in `AdminResearch.tsx` and imported elsewhere, check `grep -r "AdminResearch" components/` for stray references and fix them.

- [ ] **Step 4: Final commit**

```bash
git add components/AdminDashboard.tsx
git rm components/admin/AdminResearch.tsx
git add docs/superpowers/specs/2026-06-17-research-tab-redesign.md docs/superpowers/plans/2026-06-17-research-tab-redesign.md
git commit -m "feat: research tab redesign — decomposed components, history fix, model update, CSV export, content drafts, competitor analysis, pinned products"
git push
```

---

## Self-Review Checklist

- [x] **Spec coverage:** All bugs fixed (history section rendered, activeSection type fixed, quick niches always shown, two-phase research, gemini-3o model). All four new features implemented (CSV export, content drafts, competitor analysis, pinned products).
- [x] **No placeholders:** All steps contain complete code.
- [x] **Type consistency:** `SavedResearch` and `PinnedProduct` defined in `HistoryPanel.tsx` and re-exported; imported in `index.tsx` as `import { HistoryPanel, SavedResearch, PinnedProduct }`. `CompetitorAnalysis` and `ContentDraftContext` defined and exported in `researchService.proxy.ts`. `exportToCSV` signature in `researchExport.ts` matches call in `index.tsx`.
- [x] **Import paths:** All sub-components use `../../../services/` (three levels up from `components/admin/research/`). `AdminDashboard.tsx` imports from `./admin/research` which resolves to `index.tsx`.
