# Research Tab Redesign — Design Spec
**Date:** 2026-06-17  
**Status:** Approved

---

## Overview

Full redesign of the admin Research tab. Fixes all known bugs, decomposes the 503-line monolith into focused sub-components, updates the AI model, and adds four new features: CSV export, AI content drafts, competitor URL analysis, and pinned products.

---

## Bug Fixes

| Bug | Fix |
|---|---|
| `activeSection` typed as `'products' \| 'niche' \| 'strategies'` — history tab click is a no-op | Expand type to include `'history'` and `'competitor'` |
| History section never renders | Add `HistoryPanel` render block, remove `lastQuery` gate |
| Quick niches hidden after first search | Always render niche chips; collapse into a "Search another niche" toggle after a search |
| Marketing strategies receive empty product array | Two-phase research: Phase 1 runs products + niche in parallel; Phase 2 calls strategies with the resolved product names |
| Model is `gemini-1.5-pro` — other services use `gemini-3o` | Update `researchService.proxy.ts` to use `gemini-3o` |

---

## File Structure

```
components/admin/research/
├── index.tsx                  ← Orchestrator: state, API calls, callbacks
├── ResearchHeader.tsx         ← Search input, quick niches, export + save buttons
├── TrendingProductsPanel.tsx  ← Product grid with pin / copy / add / draft actions
├── NichePanel.tsx             ← Market metrics, keywords, content ideas
├── StrategiesPanel.tsx        ← Accordion strategies list
├── HistoryPanel.tsx           ← Saved research + pinned products sub-tabs
├── CompetitorPanel.tsx        ← URL input + competitor breakdown results
└── ContentDraftModal.tsx      ← Type picker + generated markdown + copy / add-as-post actions

services/
├── researchService.proxy.ts   ← Updated: model, + analyzeCompetitorUrl(), + generateContentDraft()
└── researchExport.ts          ← New: CSV export utility

components/admin/AdminDashboard.tsx  ← Import updated to research/index.tsx
```

The existing `components/admin/AdminResearch.tsx` is replaced entirely.

---

## State Shape (index.tsx)

```typescript
type ActiveSection = 'products' | 'niche' | 'strategies' | 'history' | 'competitor';

// Research results
products: TrendingProduct[]
nicheInsight: NicheInsight | null
strategies: MarketingStrategy[]
lastQuery: string
searchQuery: string

// Loading — two phases
isLoadingPhase1: boolean   // products + niche
isLoadingPhase2: boolean   // strategies (after phase 1)

// Persistence
savedResearch: SavedResearch[]
pinnedProducts: PinnedProduct[]   // localStorage only

// UI
activeSection: ActiveSection
expandedStrategy: number | null
isContentDraftOpen: boolean
contentDraftContext: 'products' | 'niche' | 'strategies' | null
isSaving: boolean
isLoadingHistory: boolean

interface PinnedProduct extends TrendingProduct {
  pinnedAt: string
  sourceQuery: string
}
```

---

## Data Flow

```
User enters niche → handleResearch()
  Phase 1 (parallel):
    researchTrendingProducts(niche) → setProducts()
    analyzeNiche(niche)             → setNicheInsight()
  Phase 2 (after phase 1 resolves):
    generateMarketingStrategies(niche, productNames) → setStrategies()

Pin product → togglePin(product)
  → read/write localStorage key 'gsl_pinned_products'
  → update pinnedProducts state

Competitor analysis → handleCompetitorAnalysis(url)
  → analyzeCompetitorUrl(url) [single independent call]
  → CompetitorPanel displays results

Export → exportToCSV(products, nicheInsight, strategies, query)
  → triggers browser download

Content draft → openContentDraft(context)
  → ContentDraftModal: user picks type (Blog / Social / Email)
  → generateContentDraft(type, researchContext)
  → displays markdown + "Add as Blog Post" action
```

---

## Sub-component Contracts

### `ResearchHeader`
Props: `searchQuery, onSearchChange, onResearch, onQuickNiche, isLoading, hasResults, onSave, onExport, isSaving`  
Renders search input, quick niche chips (always visible, collapsible when `hasResults`), and action row (Save, Export CSV, Clear).

### `TrendingProductsPanel`
Props: `products, pinnedIds, onPin, onCopy, onAddToProduct, onDraftContent`  
Renders 2-col product grid. Each card has: rank, name, price, competition, profit, affiliate angle, target audience, trend badge, and action icons (pin ★, copy, Amazon link, add to catalogue, draft ✨).

### `NichePanel`
Props: `nicheInsight, onDraftContent`  
Renders 3 metric cards (market size, growth, competition), keywords, seasonality, content ideas. "Draft Content" button top-right.

### `StrategiesPanel`
Props: `strategies, expandedIndex, onToggle, onDraftContent`  
Accordion list. Each row: strategy name, platform, difficulty badge, budget. Expanded: ROI, time-to-results, numbered steps, pro tip. "Draft Content" button per strategy.

### `HistoryPanel`
Props: `savedResearch, pinnedProducts, onLoad, onDelete, onUnpin`  
Two sub-tabs: "Saved" (DB records, with load/delete) and "Pinned" (localStorage products, with unpin). Always rendered regardless of `lastQuery`.

### `CompetitorPanel`
Props: `onAnalyze, isAnalyzing, result`  
URL text input + Analyze button. Results show: top keywords found, affiliate products linked, content gaps (topics they don't cover), recommended Amazon search queries. Independent of main research state.

---

## New Service Functions (`researchService.proxy.ts`)

### `analyzeCompetitorUrl(url: string): Promise<CompetitorAnalysis>`
```typescript
interface CompetitorAnalysis {
  url: string
  topKeywords: string[]
  linkedProducts: { name: string; amazonQuery: string; estimatedPrice: number }[]
  contentGaps: string[]
  affiliateOpportunities: string[]
  overallStrength: 'Weak' | 'Moderate' | 'Strong'
}
```
Prompt instructs Gemini to fetch and analyze the URL using Google Search grounding, extract affiliate links and keywords, identify what topics the site misses.

### `generateContentDraft(type: 'blog' | 'social' | 'email', context: ContentDraftContext): Promise<string>`
```typescript
interface ContentDraftContext {
  query: string
  products?: TrendingProduct[]
  nicheInsight?: NicheInsight | null
  strategies?: MarketingStrategy[]
}
```
Returns Markdown string. Blog: 600-900 word post with product recommendations and Amazon links. Social: 3 caption variants (TikTok/Instagram/Pinterest). Email: subject line + body with CTA.

---

## Export (`researchExport.ts`)

`exportToCSV(products, nicheInsight, strategies, query)` — builds a multi-section CSV:
- Section 1: Niche metrics (market size, growth, keywords)
- Section 2: Products (rank, name, price, competition, profit, trend)
- Section 3: Strategies (name, platform, difficulty, ROI, budget)

Triggers download via `URL.createObjectURL(blob)` + `<a>.click()`. No external dependency.

---

## Pinned Products

- Stored in `localStorage` under key `gsl_pinned_products` as `PinnedProduct[]`
- Loaded on mount alongside DB history
- `togglePin(product, query)`: add if not present (by name), remove if present
- Displayed in `HistoryPanel` "Pinned" sub-tab with query label and unpin button
- Max 50 pinned products (oldest dropped if over limit)

---

## AdminDashboard.tsx Update

Change import from:
```typescript
import { AdminResearch } from './admin/AdminResearch';
```
to:
```typescript
import { AdminResearch } from './admin/research';
```
No other changes to `AdminDashboard.tsx`.

---

## What Is Not Changing

- Supabase `research_history` table schema — no migration needed
- `database.ts` / `supabase/service.ts` research methods — unchanged
- The proxy call pattern (`callProxy`) — unchanged
- All other admin tabs — untouched
