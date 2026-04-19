# Implementation Plan

**Project:** GoSimpleLiving  
**Date:** 2026-04-09

---

## Phase 1 — Critical Bugs & Security (Today)

| # | Task | File | Effort |
|---|------|------|--------|
| 1.1 | Fix broken import path in validators.ts | `src/utils/validators.ts` | 2 min |
| 1.2 | Remove console.log from AdminDashboard | `components/AdminDashboard.tsx:147` | 1 min |
| 1.3 | Add wishlist rollback on network failure | `src/hooks/useAuth.ts` | 10 min |
| 1.4 | Clear localStorage cache on logout | `src/hooks/useAuth.ts` | 5 min |
| 1.5 | Add `loading="lazy"` to blog post images | `components/BlogPage.tsx` | 2 min |
| 1.6 | Add alt text to ProductRow images | `components/AdminDashboard.tsx` | 2 min |

**Total Phase 1:** ~22 minutes

---

## Phase 2 — Performance & Code Quality (This Week)

| # | Task | File | Effort |
|---|------|------|--------|
| 2.1 | Add `React.memo` to ProductCard | `components/ProductCard.tsx` | 15 min |
| 2.2 | Add DB pagination (limit 50 initial) | `supabase/service.ts` | 1 hr |
| 2.3 | Add product validation before save | `components/AdminDashboard.tsx` | 30 min |
| 2.4 | Fix Unsplash Source → Picsum URLs | `services/geminiService.ts` | 5 min |
| 2.5 | Remove 40+ unused imports | multiple files | 30 min |
| 2.6 | Add CSP header in vercel.json | `vercel.json` | 15 min |

**Total Phase 2:** ~3.5 hours

---

## Phase 3 — Refactor AdminDashboard (Next Sprint)

Split `components/AdminDashboard.tsx` (1936 lines) into focused components:

```
components/admin/
  AdminLayout.tsx         # Shell, tab nav, connection status
  AdminProducts.tsx       # Product CRUD table + form
  AdminBlog.tsx           # Blog post CRUD
  AdminThemeContent.tsx   # Site content & theme editor
  AdminConfig.tsx         # Settings, DB diagnostics, seeding
```

**Effort:** 4–6 hours  
**Impact:** Faster admin panel, easier testing, smaller per-tab bundles

---

## Phase 4 — Missing Features (Next Month)

### 4.1 Per-Page SEO Metadata
- Add `seoTitle`, `seoDescription`, `seoKeywords` fields to BlogPost type
- Render `<meta>` tags via a `<SEOHead>` component in BlogPage
- Add fields to blog post editor in AdminDashboard

### 4.2 Analytics Dashboard
- Create `components/admin/AdminAnalytics.tsx`
- Query `analytics_events` table grouped by product, date, traffic source
- Render bar/line charts using a lightweight chart library (recharts or chart.js)

### 4.3 Blog Search
- Add search input to BlogPage header
- Filter posts client-side on title/excerpt match
- Debounce input to avoid excessive re-renders

### 4.4 Product CSV Import/Export
- Export: serialize current products array to CSV and trigger download
- Import: parse CSV file, validate each row with `validateProduct()`, batch insert

---

## Security Roadmap

### Move Gemini API Key Server-Side
1. Create `supabase/functions/gemini-proxy/index.ts` Edge Function
2. Store `GEMINI_API_KEY` in Supabase secrets (not exposed to browser)
3. Update `geminiService.ts` to POST to the edge function URL instead of calling Gemini SDK directly
4. Remove localStorage API key storage from SettingsPage

### Add Content Security Policy
```json
// vercel.json addition
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://generativelanguage.googleapis.com"
}
```

---

## Done Criteria

- [x] Phase 1: Zero broken imports, no console.log in prod, wishlist reverts on failure, cache cleared on logout
- [x] Phase 2: ProductCard memoized, products paginated, validation enforced, CSP + security headers added, User type conflict fixed, debug logs removed
- [ ] Phase 3: AdminDashboard < 200 lines (just shell + routing), all tabs in separate files
- [ ] Phase 4: Blog search live, SEO meta tags rendering, analytics charts visible
