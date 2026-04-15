# Supabase Connection Hardening Design

**Date:** 2026-04-15
**Approach:** Consolidate and Harden
**Scope:** Connection resilience, auth session stability, cache unification

---

## Problem Statement

GoSimpleLiving (React 19 + Supabase free tier) has three interrelated connection issues:

1. **Intermittent disconnections** — the app shows "offline" randomly during normal use
2. **Auth/session loss** — users get logged out unexpectedly, especially after tab switching or DB cold starts
3. **Stale cached data** — edits don't appear, refresh returns old data, logout doesn't clear previous user's cache

### Root Causes

| # | Cause | File | Impact |
|---|-------|------|--------|
| 1 | Health check treats 1 failed ping as "offline," stops checking, waits 5 min to retry | `services/connectionManager.ts:84-99` | False "offline" from transient blips |
| 2 | Custom `fetchWithTimeout` (30s abort) wraps all SDK requests including auth token refresh | `supabase/config.ts:68-77` | Token refresh aborted during cold start = session dies |
| 3 | Two independent cache layers with different key prefixes and TTLs | `supabase/service.ts` (`gsl_cache_*`, 30min TTL) vs `src/modules/cache/` (`gosimpleliving_cache_*`, no TTL) | Caches conflict, data inconsistent |
| 4 | `refreshData()` calls service functions that check cache first | `src/contexts/AppContext.tsx:164-197` | "Refresh" returns stale cached data |
| 5 | Write operations clear base cache key but not paginated keys (`gsl_cache_products_p1`, etc.) | `supabase/service.ts:403-404` | Edits invisible until cache expires |
| 6 | signOut clears keys starting with `cache_*` but actual keys are `gsl_cache_*` and `gosimpleliving_cache_*` | `src/hooks/useAuth.ts:27-30` | Next user sees previous user's cached data |
| 7 | No tab visibility handling — session and connection not revalidated on tab return | All connection files | Stale "connected" status with expired session after tab switch |

### Environment Context

- Supabase free tier (DB pauses after ~1 week inactivity, cold starts take 10-30s)
- Very low traffic (a few admins)
- Deployed on Vercel
- No realtime subscriptions in use

---

## Design

### 1. Remove `fetchWithTimeout` from Supabase Client

**File:** `supabase/config.ts`

Remove the custom `fetchWithTimeout` wrapper entirely. The Supabase JS SDK manages its own fetch timeouts and retry logic internally. The custom wrapper interferes with the SDK's auth token refresh mechanism.

Also remove the `realtime` configuration block — the app doesn't use realtime subscriptions, and the heartbeat adds unnecessary network traffic that can trigger false disconnection events.

**After:**

```ts
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      global: {
        headers: { 'x-application-name': 'go-simple-living' }
      },
      db: {
        schema: 'public'
      }
    });
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
  }
}
```

### 2. Harden ConnectionManager

**File:** `services/connectionManager.ts`

#### 2a. Consecutive failure threshold

Add a `consecutiveFailures` counter to `ConnectionState`. Health check failures increment the counter. Only transition to "offline" after 3 consecutive failures. Any successful check resets the counter to 0.

```
Health check fails -> consecutiveFailures=1 (status stays "connected")
Health check fails -> consecutiveFailures=2 (status stays "connected")
Health check fails -> consecutiveFailures=3 -> status transitions to "offline"
Health check succeeds at any point -> consecutiveFailures=0
```

Add `CONSECUTIVE_FAILURE_THRESHOLD = 3` to `ConnectionConfig`.

#### 2b. Faster recovery backoff

Replace the fixed 5-minute `backgroundRetryInterval` with an escalating backoff for recovery:

```
Retry 1:  30s   (catches fast cold-start wakeups)
Retry 2:  60s
Retry 3:  120s
Retry 4+: 300s  (settle into background polling)
```

Implementation: `backgroundRetryInterval` becomes the base value (30s). Each retry multiplies by 2, capped at 300s. Reset to base on successful reconnection.

#### 2c. Visibility-aware reconnection

Add a `visibilitychange` event listener in the constructor:

```ts
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    this.onTabVisible();
  }
});
```

`onTabVisible()` does three things:
1. Run an immediate health check (don't wait for next interval)
2. Revalidate the Supabase auth session via a callback (`sessionRevalidator`)
3. If last successful data fetch is older than 5 minutes, notify listeners that a refresh is recommended

Add a `setSessionRevalidator(handler: () => Promise<void>)` method, called from `database.ts` to wire up `supabase.auth.getSession()`.

### 3. Consolidate to Single Cache Layer

**Keep:** `src/modules/cache/` (CacheService with adapter pattern)
**Remove:** Inline cache in `supabase/service.ts` (delete `saveToCache`, `getFromCache`, `CACHE_TTL`, `CACHE_KEYS`)

#### 3a. Add TTL support to CacheService

**File:** `src/modules/cache/adapters/localStorageAdapter.ts`

Add a `DEFAULT_TTL = 5 * 60 * 1000` (5 minutes). The `load` function checks `timestamp` against TTL and returns `null` if expired.

5 minutes (not 30) because:
- Few admins actively editing = fresh data matters more than saving requests
- Free tier has generous API limits for low traffic
- Eliminates the "I just edited this but I see the old version" problem

#### 3b. Extend CacheKey for pagination

**File:** `src/modules/cache/domain/entities.ts`

Change `CacheKey` from a union literal to a string type with known prefixes:

```ts
export type CacheEntityPrefix = 'products' | 'blogs' | 'content';
export type CacheKey = CacheEntityPrefix | `${CacheEntityPrefix}_p${number}`;
```

#### 3c. Add entity-level cache clearing

**File:** `src/modules/cache/useCases/cacheUseCases.ts`

Add `clearEntity(prefix: CacheEntityPrefix)` that clears all keys matching that entity (e.g., `products`, `products_p0`, `products_p1`, etc.).

**File:** `src/modules/cache/adapters/localStorageAdapter.ts`

Add `clearByPrefix(prefix: string)` that iterates localStorage and removes all keys matching `gosimpleliving_cache_{prefix}*`.

#### 3d. Add `forceRefresh` parameter to service reads

**File:** `supabase/service.ts`

All read functions (`getProducts`, `getBlogPosts`, `getSiteContent`) get an optional `forceRefresh?: boolean` parameter. When true, skip cache lookup and go straight to Supabase.

After a successful Supabase fetch, save to `CacheService`.

```ts
export const getProducts = async (page = 0, forceRefresh = false): Promise<Product[] | null> => {
  if (!supabase) return null;

  const cacheKey = page === 0 ? 'products' : `products_p${page}`;
  if (!forceRefresh) {
    const cached = CacheService.load(cacheKey);
    if (cached) return cached;
  }

  try {
    // ... fetch from Supabase ...
    CacheService.save(cacheKey, data);
    return data;
  } catch (e) {
    return null;
  }
};
```

### 4. Fix Cache Invalidation

**File:** `supabase/service.ts`

All write functions (create/update/delete for products, blog posts, site content) call `CacheService.clearEntity('products')` / `CacheService.clearEntity('blogs')` / `CacheService.clearEntity('content')` after successful writes.

This replaces the current `localStorage.removeItem(CACHE_KEYS.products)` which missed paginated keys.

### 5. Fix signOut Cache Cleanup

**File:** `src/hooks/useAuth.ts`

Replace the broken key-matching logic:

```ts
const signOut = async () => {
  CacheService.clearAllMemory();                    // Clear all gosimpleliving_cache_* keys
  localStorage.removeItem('gsl_connection_state');   // Clear connection state
  await dbService.signOut();
};
```

Import `CacheService` from `../modules/cache`.

### 6. Update AppContext to Use forceRefresh

**File:** `src/contexts/AppContext.tsx`

- `refreshData()` calls service functions with `forceRefresh: true`
- Remove the duplicate `CacheService.saveProducts()` / `CacheService.saveBlogs()` / `CacheService.saveContent()` calls — the service layer now handles caching after fetch
- Keep the initial `CacheService.loadProducts()` / etc. for instant hydration on first render (this is good — no change needed)

### 7. Update Database Service Interface

**File:** `services/database.ts`

Update the `DatabaseService` interface to include `forceRefresh` on read methods:

```ts
getProducts: (page?: number, forceRefresh?: boolean) => Promise<Product[] | null>;
getBlogPosts: (page?: number, forceRefresh?: boolean) => Promise<BlogPost[] | null>;
getSiteContent: (forceRefresh?: boolean) => Promise<SiteContent | null>;
```

Wire up the session revalidator. Add a `revalidateSession` export to `supabase/service.ts`:

```ts
// In supabase/service.ts
export const revalidateSession = async (): Promise<void> => {
  if (!supabase) return;
  await supabase.auth.getSession();
};
```

Then in `database.ts`:

```ts
connectionManager.setSessionRevalidator(supabaseService.revalidateSession);
```

---

## Files Changed

| File | Change Type | Description |
|------|------------|-------------|
| `supabase/config.ts` | Modify | Remove `fetchWithTimeout`, remove `realtime` config |
| `services/connectionManager.ts` | Modify | Add consecutive failure threshold (3), faster recovery backoff (30s/60s/120s/300s), `visibilitychange` listener, session revalidation callback |
| `supabase/service.ts` | Modify | Remove inline cache, add `forceRefresh` param to reads, use `CacheService`, fix write invalidation |
| `src/modules/cache/adapters/localStorageAdapter.ts` | Modify | Add TTL support (5 min), add `clearByPrefix` |
| `src/modules/cache/domain/entities.ts` | Modify | Extend `CacheKey` to support paginated keys |
| `src/modules/cache/useCases/cacheUseCases.ts` | Modify | Add TTL-aware load, add `clearEntity` method, add generic `save`/`load` accepting extended keys |
| `src/hooks/useAuth.ts` | Modify | Fix signOut to call `CacheService.clearAllMemory()` + clear `gsl_connection_state` |
| `src/contexts/AppContext.tsx` | Modify | Use `forceRefresh: true` in `refreshData()`, remove redundant `CacheService.save*` calls after hydration |
| `services/database.ts` | Modify | Update interface for `forceRefresh`, wire up session revalidator |

**Not changed:** `App.tsx`, UI components, `types.ts`, route files. This is purely connection/cache infrastructure.

---

## Success Criteria

- [ ] Tab away for 10+ minutes, tab back: no "offline" flash, session intact, data refreshes in background
- [ ] Kill network for 5 seconds, restore: app stays "connected" (absorbed by failure threshold)
- [ ] Kill network for 30+ seconds: app transitions to "offline," recovers within 30-60s of network restore
- [ ] Admin edits a product: change visible immediately on next read (cache invalidated)
- [ ] Click "Refresh": returns fresh data from Supabase, not cached data
- [ ] Log out and log in as different user: no data from previous user visible
- [ ] Cold start (DB waking from sleep): auth session survives the 10-30s wait, no logout
- [ ] Only one set of localStorage keys (`gosimpleliving_cache_*`) — no orphaned `gsl_cache_*` keys

---

## Out of Scope

- Realtime subscriptions (not needed for few-admin site)
- Server-side caching (Vercel edge, etc.)
- Moving Gemini API key server-side (separate security task)
- AdminDashboard refactor (separate Phase 3 task)
- Migration to Supabase paid tier
