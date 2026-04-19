# GoSimpleLiving - Code Evaluation & Recommendations

**Evaluated:** 2026-04-09  
**Stack:** React 19 + TypeScript 5.8 + Vite 6 + Supabase + Tailwind CSS 4 + Gemini AI

---

## Executive Summary

The codebase is a well-architected affiliate e-commerce platform with solid patterns (error boundaries, connection resilience, lazy loading, caching). However, it has a broken import path that prevents compilation, several security gaps, performance opportunities, and a 1936-line monolithic component that needs breaking up.

---

## Critical Bugs (Fix Immediately)

### 1. Broken Import in validators.ts
**File:** `src/utils/validators.ts:1`  
**Issue:** `import { Product, BlogPost } from '../types'` resolves to `src/types.ts` which doesn't exist. The actual types file is at the project root `types.ts`.  
**Fix:** Change to `../../types` or `@/types`

### 2. Gemini API `ai` Variable Used Without Null Check
**File:** `services/geminiService.ts`  
**Issue:** `streamShoppingAdvice` throws directly if `ai` is null — the other functions return early but this one does not check consistently.  
**Status:** Already guarded with `if (!ai) throw new Error(...)` — acceptable.

### 3. `console.log` Left in AdminDashboard Production Code
**File:** `components/AdminDashboard.tsx:147`  
**Issue:** `console.log('AdminDashboard Rendered. activeTab:', activeTab)` runs on every render in production.  
**Fix:** Remove it.

---

## Security Issues

### HIGH: API Key Stored in localStorage
**File:** `services/geminiService.ts:9`  
**Risk:** Any XSS attack can steal the Gemini API key from localStorage, enabling unauthorized AI model usage billed to the owner.  
**Recommendation:** Route Gemini calls through a Supabase Edge Function or Vercel API route. The key stays server-side.

### HIGH: No Content-Security-Policy Headers
**File:** `vercel.json`  
**Risk:** Without CSP, XSS attacks can execute arbitrary scripts.  
**Recommendation:** Add a CSP header in `vercel.json` at minimum blocking `unsafe-inline` scripts.

### MEDIUM: Cache Not Cleared on Logout
**File:** `src/hooks/useAuth.ts:25`  
**Risk:** If two users share a device, the second user sees the first user's cached wishlist and preferences.  
**Fix:** Clear relevant localStorage keys in `signOut()`.

### MEDIUM: Markdown Renders Raw HTML
**File:** `components/MarkdownRenderer.tsx`  
**Risk:** `rehypeRaw` plugin passes through raw HTML; if blog content ever comes from non-admin sources, XSS is possible.  
**Recommendation:** Add DOMPurify sanitization before rendering, or remove `rehypeRaw` if raw HTML in posts isn't needed.

### MEDIUM: No Input Validation Before DB Writes
**File:** `components/AdminDashboard.tsx`  
**Risk:** Product/blog data submitted without running through `validators.ts` before hitting Supabase.  
**Fix:** Call `validateProduct()` / `validateBlogPost()` before calling `onAddProduct` / `onUpdateProduct`.

### LOW: No Admin Audit Log
**Risk:** No record of which admin changed what. Cannot investigate unauthorized changes.  
**Recommendation:** Log admin write operations to a `audit_log` table in Supabase.

---

## Performance Issues

### HIGH: AdminDashboard is 1936 Lines
**File:** `components/AdminDashboard.tsx`  
**Impact:** Single massive component re-renders everything on any state change; massive bundle chunk; unmaintainable.  
**Recommendation:** Split by tab:
```
components/admin/
  AdminProducts.tsx
  AdminBlog.tsx
  AdminThemeContent.tsx
  AdminUsers.tsx
  AdminConfig.tsx
```

### HIGH: No DB Query Pagination
**File:** `supabase/service.ts` — `getProducts()`, `getBlogPosts()`  
**Impact:** Fetches ALL records on every load. At 1000 products = ~2MB payload, 10+ second load.  
**Recommendation:** Add `.range(0, 49)` for initial load and implement infinite scroll or "load more".

### MEDIUM: Blog Post Images Missing `loading="lazy"`
**File:** `components/BlogPage.tsx:178`  
**Impact:** All blog post card images load immediately, even those below the fold.  
**Fix:** Add `loading="lazy"` attribute.

### MEDIUM: No `React.memo` on ProductCard
**File:** `components/ProductCard.tsx`  
**Impact:** All cards re-render when any product state changes (e.g., filter applied).  
**Fix:** Wrap component with `React.memo()`.

### LOW: Unsplash Source API Used for Images
**File:** `services/geminiService.ts:447, 464`  
**Issue:** `source.unsplash.com` is deprecated and returns errors. Generated image URLs will be broken.  
**Fix:** Use Unsplash API with an access key, or switch to Picsum (`picsum.photos`).

---

## Code Quality Issues

### Duplicate Settings Components
**Files:** `components/AdminSettings.tsx` AND `components/SettingsPage.tsx`  
**Issue:** Two nearly identical components for admin settings. Causes confusion and maintenance duplication.  
**Fix:** Consolidate into one; remove the other.

### Unused Imports (40+)
Multiple files import icons and hooks that are never used, inflating the bundle.  
**Fix:** Run `npm run tsc --noEmit` and remove all reported unused import warnings.

### Wishlist Optimistic Update Without Rollback
**File:** `src/hooks/useAuth.ts:44`  
**Issue:** On network failure, the UI shows the wrong wishlist state permanently (the catch block only logs a warning).  
**Fix:** Revert `user.wishlist` to the previous value in the catch block.

---

## Missing Features (Prioritized)

| Priority | Feature | Value |
|----------|---------|-------|
| HIGH | Per-page SEO metadata for blog posts | Google ranking |
| HIGH | Product pagination / infinite scroll | Scalability |
| MEDIUM | Analytics dashboard (charts for CTR, top products) | Business insight |
| MEDIUM | Blog post search/filter | User experience |
| MEDIUM | Product bulk CSV import/export | Operations at scale |
| MEDIUM | Editor role enforcement in UI | Multi-user workflow |
| LOW | Product comparison tool | Conversion rate |
| LOW | Real-time collaboration via Supabase Realtime | Multi-admin |
| LOW | Service worker for offline support | Resilience |

---

## Implementation Plan

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for the phased rollout.
