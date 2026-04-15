# Supabase Connection Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix intermittent disconnections, auth session loss, and stale cache data on the GoSimpleLiving Supabase free-tier setup.

**Architecture:** Remove the custom fetch wrapper that kills auth token refresh. Harden the connection manager with consecutive failure tolerance and faster recovery. Consolidate two competing cache layers into one with proper TTL, invalidation, and signOut cleanup. Add tab visibility handling to revalidate sessions on return.

**Tech Stack:** React 19, TypeScript 5.8, Supabase JS SDK, Vite 6, localStorage

**Spec:** `docs/superpowers/specs/2026-04-15-supabase-connection-hardening-design.md`

**Note:** This project has no test framework. Verification steps use `npm run build` (TypeScript compilation) and manual browser testing against the success criteria in the spec.

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `supabase/config.ts` | Modify | Supabase client creation (remove fetchWithTimeout, remove realtime) |
| `services/connectionManager.ts` | Modify | Connection state machine (add failure threshold, faster backoff, visibility handling) |
| `src/modules/cache/domain/entities.ts` | Modify | Cache type definitions (extend CacheKey for pagination) |
| `src/modules/cache/adapters/localStorageAdapter.ts` | Modify | localStorage adapter (add TTL, add clearByPrefix) |
| `src/modules/cache/useCases/cacheUseCases.ts` | Modify | Cache use cases (add generic save/load, clearEntity, TTL-aware load) |
| `src/modules/cache/index.ts` | Modify | Re-export new types |
| `supabase/service.ts` | Modify | DB service (remove inline cache, use CacheService, add forceRefresh, add revalidateSession) |
| `services/database.ts` | Modify | DB facade (update interface for forceRefresh, wire session revalidator) |
| `src/hooks/useAuth.ts` | Modify | Auth hook (fix signOut cleanup) |
| `src/contexts/AppContext.tsx` | Modify | App context (use forceRefresh in refreshData, remove redundant cache saves) |

---

## Task 1: Remove fetchWithTimeout and realtime config from Supabase client

**Files:**
- Modify: `supabase/config.ts`

- [ ] **Step 1: Remove the fetchWithTimeout function and realtime config**

Open `supabase/config.ts`. Delete the `fetchWithTimeout` function (lines 68-77) and update the `createClient` call to remove the `global.fetch` and `realtime` options:

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

The full file after changes should be:

```ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase configuration with robust environment variable detection
 * Supports:
 * - Vite (import.meta.env.VITE_*)
 * - Vercel/Next.js (process.env.NEXT_PUBLIC_*)
 * - Standard Node (process.env.*)
 */

const getViteEnv = (key: string) => {
  if (typeof import.meta === 'undefined' || !(import.meta as any).env) return undefined;

  const env = (import.meta as any).env;
  if (key === 'VITE_SUPABASE_URL') return env.VITE_SUPABASE_URL;
  if (key === 'NEXT_PUBLIC_SUPABASE_URL') return env.NEXT_PUBLIC_SUPABASE_URL;
  if (key === 'VITE_SUPABASE_ANON_KEY') return env.VITE_SUPABASE_ANON_KEY;
  if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') return env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return undefined;
}

const getProcessEnv = (key: string): string | undefined => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }
  } catch (e) {
    // Ignore errors if process is not defined
  }
  return undefined;
};

const supabaseUrl =
  getViteEnv('VITE_SUPABASE_URL') ||
  getViteEnv('NEXT_PUBLIC_SUPABASE_URL') ||
  getProcessEnv('NEXT_PUBLIC_SUPABASE_URL') ||
  getProcessEnv('VITE_SUPABASE_URL') ||
  getProcessEnv('SUPABASE_URL');

const supabaseKey =
  getViteEnv('VITE_SUPABASE_ANON_KEY') ||
  getViteEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
  getProcessEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
  getProcessEnv('VITE_SUPABASE_ANON_KEY') ||
  getProcessEnv('SUPABASE_ANON_KEY');

let supabase: SupabaseClient | null = null;

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
} else if (typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV) {
  console.warn('Supabase not configured: missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

export { supabase };
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors related to `supabase/config.ts`.

- [ ] **Step 3: Commit**

```bash
git add supabase/config.ts
git commit -m "fix: remove fetchWithTimeout that kills auth token refresh

The custom 30s AbortController wrapper was aborting Supabase SDK internal
auth token refresh during free-tier cold starts, causing session loss.
Also removes unused realtime config."
```

---

## Task 2: Extend CacheService with TTL, generic save/load, and entity clearing

**Files:**
- Modify: `src/modules/cache/domain/entities.ts`
- Modify: `src/modules/cache/adapters/localStorageAdapter.ts`
- Modify: `src/modules/cache/useCases/cacheUseCases.ts`
- Modify: `src/modules/cache/index.ts`

- [ ] **Step 1: Update cache entity types**

Replace the contents of `src/modules/cache/domain/entities.ts` with:

```ts
/** Entity prefixes for cache keys */
export type CacheEntityPrefix = 'products' | 'blogs' | 'content';

/** Cache keys: either a base entity key or a paginated variant */
export type CacheKey = CacheEntityPrefix | `${CacheEntityPrefix}_p${number}`;

/** What a cached item looks like in storage */
export interface CacheItem<T> {
    data: T;
    timestamp: number;
}
```

- [ ] **Step 2: Add TTL and clearByPrefix to localStorage adapter**

Replace the contents of `src/modules/cache/adapters/localStorageAdapter.ts` with:

```ts
import { CacheItem, CacheKey } from '../domain/entities';

const CACHE_PREFIX = 'gosimpleliving_cache_';

/** Default TTL: 5 minutes */
const DEFAULT_TTL_MS = 5 * 60 * 1000;

/**
 * localStorage adapter with TTL support
 */
export const localStorageAdapter = {
    save<T>(key: CacheKey, data: T): void {
        try {
            const item: CacheItem<T> = {
                data,
                timestamp: Date.now(),
            };
            localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(item));
        } catch (e) {
            console.warn(`[Cache] Could not save ${key}`, e);
        }
    },

    load<T>(key: CacheKey): T | null {
        try {
            const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
            if (!raw) return null;

            const item = JSON.parse(raw) as CacheItem<T>;

            // TTL check — return null if expired
            if (Date.now() - item.timestamp > DEFAULT_TTL_MS) {
                localStorage.removeItem(`${CACHE_PREFIX}${key}`);
                return null;
            }

            return item.data;
        } catch (e) {
            console.warn(`[Cache] Could not load ${key}`, e);
            return null;
        }
    },

    /**
     * Load ignoring TTL — used for initial hydration on page load
     * so the UI renders instantly even with expired cache.
     */
    loadIgnoringTTL<T>(key: CacheKey): T | null {
        try {
            const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
            if (!raw) return null;

            const item = JSON.parse(raw) as CacheItem<T>;
            return item.data;
        } catch (e) {
            return null;
        }
    },

    clear(key: CacheKey): void {
        try {
            localStorage.removeItem(`${CACHE_PREFIX}${key}`);
        } catch (e) {
            // Ignore
        }
    },

    /**
     * Clear all keys matching a prefix (e.g., 'products' clears
     * 'products', 'products_p0', 'products_p1', etc.)
     */
    clearByPrefix(prefix: string): void {
        try {
            const fullPrefix = `${CACHE_PREFIX}${prefix}`;
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith(fullPrefix)) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));
        } catch (e) {
            // Ignore
        }
    },

    clearAll(): void {
        try {
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith(CACHE_PREFIX)) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));
        } catch (e) {
            // Ignore
        }
    }
};
```

- [ ] **Step 3: Update CacheService use cases**

Replace the contents of `src/modules/cache/useCases/cacheUseCases.ts` with:

```ts
import { localStorageAdapter } from '../adapters/localStorageAdapter';
import { CacheKey, CacheEntityPrefix } from '../domain/entities';
import { Product, BlogPost, SiteContent } from '../../../../types';

/**
 * Unified cache service. All cache reads/writes go through here.
 */
export const ObjectCacheService = {

    // --- Generic save/load (used by service layer) ---

    save<T>(key: CacheKey, data: T): void {
        localStorageAdapter.save(key, data);
    },

    load<T>(key: CacheKey): T | null {
        return localStorageAdapter.load<T>(key);
    },

    // --- Initial hydration (ignores TTL for instant UI) ---

    loadProducts(): Product[] | null {
        return localStorageAdapter.loadIgnoringTTL<Product[]>('products');
    },

    loadBlogs(): BlogPost[] | null {
        return localStorageAdapter.loadIgnoringTTL<BlogPost[]>('blogs');
    },

    loadContent(): SiteContent | null {
        return localStorageAdapter.loadIgnoringTTL<SiteContent>('content');
    },

    // --- Entity-level clearing (after writes) ---

    clearEntity(prefix: CacheEntityPrefix): void {
        localStorageAdapter.clearByPrefix(prefix);
    },

    // --- Full clear (on signOut) ---

    clearAllMemory(): void {
        localStorageAdapter.clearAll();
    }
};
```

- [ ] **Step 4: Update the cache module index re-exports**

Replace the contents of `src/modules/cache/index.ts` with:

```ts
export { ObjectCacheService as CacheService } from './useCases/cacheUseCases';
export type { CacheKey, CacheEntityPrefix, CacheItem } from './domain/entities';
```

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: Build succeeds. No TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add src/modules/cache/
git commit -m "feat: add TTL, generic save/load, and entity clearing to CacheService

- 5-minute TTL on cache reads (expired entries auto-removed)
- loadIgnoringTTL for initial page hydration (instant UI)
- clearByPrefix for entity-level invalidation after writes
- Generic save/load accepting extended CacheKey type
- Extended CacheKey to support paginated keys (products_p0, etc.)"
```

---

## Task 3: Remove inline cache from supabase/service.ts, use CacheService

**Files:**
- Modify: `supabase/service.ts`

- [ ] **Step 1: Remove the inline cache constants and helpers**

At the top of `supabase/service.ts`, delete these sections (lines 9-42):

```ts
// DELETE all of this:
const CACHE_TTL = 30 * 60 * 1000;
const CACHE_KEYS = { ... };
const saveToCache = (key: string, data: any) => { ... };
const getFromCache = (key: string) => { ... };
```

- [ ] **Step 2: Add CacheService import and revalidateSession export**

Add this import at the top of `supabase/service.ts`, after the existing imports:

```ts
import { CacheService } from '../src/modules/cache';
```

Add this export at the end of the file (before the closing of the file), after the `deleteImage` function:

```ts
/**
 * Revalidate the current Supabase auth session.
 * Called by connectionManager on tab visibility change.
 */
export const revalidateSession = async (): Promise<void> => {
    if (!supabase) return;
    await supabase.auth.getSession();
};
```

- [ ] **Step 3: Update getProducts to use CacheService with forceRefresh**

Replace the `getProducts` function with:

```ts
export const getProducts = async (page = 0, forceRefresh = false): Promise<Product[] | null> => {
    if (!supabase) return null;

    const cacheKey = page === 0 ? 'products' as const : `products_p${page}` as const;

    if (!forceRefresh) {
        const cached = CacheService.load<Product[]>(cacheKey);
        if (cached) return cached;
    }

    try {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        const result = await withRetry(async () => {
            const { data, error } = await supabase!
                .from('products')
                .select('*')
                .order('status', { ascending: false })
                .range(from, to);
            if (error) throw error;
            return data;
        });

        const data = result || [];
        CacheService.save(cacheKey, data);
        return data;
    } catch (e: any) {
        console.warn(`Supabase getProducts error:`, e.message);
        return null;
    }
};
```

- [ ] **Step 4: Update getBlogPosts to use CacheService with forceRefresh**

Replace the `getBlogPosts` function with:

```ts
export const getBlogPosts = async (page = 0, forceRefresh = false): Promise<BlogPost[] | null> => {
    if (!supabase) return null;

    const cacheKey = page === 0 ? 'blogs' as const : `blogs_p${page}` as const;

    if (!forceRefresh) {
        const cached = CacheService.load<BlogPost[]>(cacheKey);
        if (cached) return cached;
    }

    try {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        const result = await withRetry(async () => {
            const { data, error } = await supabase!
                .from('posts')
                .select('*')
                .order('date', { ascending: false })
                .range(from, to);
            if (error) throw error;
            return data;
        });

        const mappedPosts = (result || []).map((p: any) => ({
            ...p,
            heroImageUrl: p.hero_image_url,
            comparisonTables: p.comparison_tables || [],
            linkedProductIds: p.linkedProductIds || p.linked_product_ids || []
        }));

        CacheService.save(cacheKey, mappedPosts);
        return mappedPosts;
    } catch (e: any) {
        console.warn(`Supabase getBlogPosts error:`, e.message);
        return null;
    }
};
```

- [ ] **Step 5: Update getSiteContent to use CacheService with forceRefresh**

Replace the `getSiteContent` function with:

```ts
export const getSiteContent = async (forceRefresh = false): Promise<SiteContent | null> => {
    if (!supabase) return null;

    if (!forceRefresh) {
        const cached = CacheService.load<SiteContent>('content');
        if (cached) return cached;
    }

    try {
        const result = await withRetry(async () => {
            const { data, error } = await supabase!.from('site_content').select('*').eq('id', 'main').single();
            if (error) throw error;
            return data;
        });

        const content = result?.content as SiteContent;
        CacheService.save('content', content);
        return content;
    } catch (e: any) {
        console.warn(`Supabase getSiteContent error:`, e.message);
        return null;
    }
};
```

- [ ] **Step 6: Update write functions to use CacheService.clearEntity**

Replace the cache invalidation lines in each write function:

In `createProduct`, `updateProduct`, `deleteProduct` — replace `localStorage.removeItem(CACHE_KEYS.products);` with:

```ts
    CacheService.clearEntity('products');
```

In `createBlogPost`, `updateBlogPost`, `deleteBlogPost` — replace `localStorage.removeItem(CACHE_KEYS.posts);` with:

```ts
    CacheService.clearEntity('blogs');
```

In `saveSiteContent` — replace `saveToCache(CACHE_KEYS.siteContent, content);` with:

```ts
    CacheService.save('content', content);
```

- [ ] **Step 7: Verify build**

Run: `npm run build`
Expected: Build succeeds. No references to `CACHE_KEYS`, `saveToCache`, or `getFromCache` remain.

- [ ] **Step 8: Commit**

```bash
git add supabase/service.ts
git commit -m "refactor: replace inline cache with unified CacheService

- Remove duplicate gsl_cache_* localStorage cache (30min TTL)
- Use CacheService (gosimpleliving_cache_*, 5min TTL) as sole cache
- Add forceRefresh param to getProducts, getBlogPosts, getSiteContent
- Fix write invalidation: clearEntity clears all paginated keys
- Add revalidateSession export for visibility change handling"
```

---

## Task 4: Update database service interface and wire session revalidator

**Files:**
- Modify: `services/database.ts`

- [ ] **Step 1: Update the DatabaseService interface and wiring**

Replace the entire contents of `services/database.ts` with:

```ts
import * as supabaseService from '../supabase/service';
import { User, Role, Product, BlogPost, SiteContent, AnalyticsEvent } from '../types';
import { connectionManager } from './connectionManager';

export interface DatabaseService {
    signIn: (email: string, pass: string) => Promise<any>;
    signInWithGoogle: () => Promise<any>;
    signUp: (email: string, pass: string, name: string) => Promise<any>;
    signOut: () => Promise<void>;
    onAuthStateChanged: (callback: (user: User | null) => void) => Function;
    updateWishlist: (uid: string, wishlist: string[]) => Promise<void>;
    updateUserName: (uid: string, name: string) => Promise<void>;
    getAllUsers: () => Promise<User[]>;
    updateUserRole: (uid: string, role: Role) => Promise<void>;
    deleteUser: (uid: string) => Promise<void>;
    requestPasswordReset: (email: string, redirectTo?: string) => Promise<void>;
    seedDatabase: (products: Product[], posts: BlogPost[], content: SiteContent) => Promise<void>;

    // Products
    getProducts: (page?: number, forceRefresh?: boolean) => Promise<Product[] | null>;
    getProductById: (id: string) => Promise<Product | null>;
    createProduct: (product: Product) => Promise<void>;
    updateProduct: (product: Product) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;

    // Blog Posts
    getBlogPosts: (page?: number, forceRefresh?: boolean) => Promise<BlogPost[] | null>;
    getBlogPostById: (id: string) => Promise<BlogPost | null>;
    getBlogPostBySlug: (slug: string) => Promise<BlogPost | null>;
    createBlogPost: (post: BlogPost) => Promise<void>;
    updateBlogPost: (post: BlogPost) => Promise<void>;
    deleteBlogPost: (id: string) => Promise<void>;

    // Site Content
    getSiteContent: (forceRefresh?: boolean) => Promise<SiteContent | null>;
    saveSiteContent: (content: SiteContent) => Promise<void>;

    // Media
    uploadImage: (base64: string, fileName: string) => Promise<string | null>;
    uploadFile: (content: string, fileName: string, contentType: string) => Promise<string | null>;
    listImages: () => Promise<{ name: string; url: string }[]>;
    deleteImage: (fileName: string) => Promise<void>;

    // Analytics
    logAnalyticsEvent: (event: AnalyticsEvent) => Promise<void>;
    testConnection: () => Promise<boolean>;
    testConnectionDetailed: () => Promise<supabaseService.DetailedConnectionResult>;
}

export const dbService: DatabaseService = {
    signIn: supabaseService.signIn,
    signInWithGoogle: supabaseService.signInWithGoogle,
    signUp: supabaseService.signUp,
    signOut: supabaseService.signOut,

    onAuthStateChanged: (callback) => {
        return supabaseService.authStateChanged((user) => {
            callback(user);
        });
    },

    updateWishlist: supabaseService.updateWishlist,
    updateUserName: supabaseService.updateUserName,
    getAllUsers: supabaseService.getAllUsers,
    updateUserRole: supabaseService.updateUserRole,
    deleteUser: supabaseService.deleteUser,
    requestPasswordReset: supabaseService.requestPasswordReset,
    seedDatabase: supabaseService.seedDatabase,

    // Products
    getProducts: supabaseService.getProducts,
    getProductById: supabaseService.getProductById,
    createProduct: supabaseService.createProduct,
    updateProduct: supabaseService.updateProduct,
    deleteProduct: supabaseService.deleteProduct,

    // Blog Posts
    getBlogPosts: supabaseService.getBlogPosts,
    getBlogPostById: supabaseService.getBlogPostById,
    getBlogPostBySlug: supabaseService.getBlogPostBySlug,
    createBlogPost: supabaseService.createBlogPost,
    updateBlogPost: supabaseService.updateBlogPost,
    deleteBlogPost: supabaseService.deleteBlogPost,

    // Site Content
    getSiteContent: supabaseService.getSiteContent,
    saveSiteContent: supabaseService.saveSiteContent,

    // Media
    uploadImage: supabaseService.uploadImage,
    uploadFile: supabaseService.uploadFile,
    listImages: supabaseService.listImages,
    deleteImage: supabaseService.deleteImage,

    // Analytics
    logAnalyticsEvent: supabaseService.logAnalyticsEvent,

    testConnection: supabaseService.testConnection,
    testConnectionDetailed: supabaseService.testConnectionDetailed,
};

// Register health check handler
connectionManager.setHealthCheckHandler(async () => {
    return await supabaseService.testConnection();
});

// Register session revalidator for tab visibility changes
connectionManager.setSessionRevalidator(supabaseService.revalidateSession);
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds. The `setSessionRevalidator` call will fail because we haven't added it to connectionManager yet — that's Task 5. If building sequentially, this error is expected and resolved by Task 5. If building all tasks at once, proceed.

- [ ] **Step 3: Commit**

```bash
git add services/database.ts
git commit -m "refactor: update DatabaseService interface for forceRefresh and session revalidation

- Add forceRefresh param to getProducts, getBlogPosts, getSiteContent
- Wire connectionManager.setSessionRevalidator to supabase revalidateSession
- Remove unused DetailedConnectionResult import indirection"
```

---

## Task 5: Harden ConnectionManager

**Files:**
- Modify: `services/connectionManager.ts`

- [ ] **Step 1: Replace connectionManager.ts with hardened version**

Replace the entire contents of `services/connectionManager.ts` with:

```ts
/**
 * Connection Manager
 * Centralized database connection state management with:
 * - Consecutive failure threshold (3 failures before "offline")
 * - Escalating recovery backoff (30s -> 60s -> 120s -> 300s)
 * - Tab visibility-aware reconnection
 * - Session revalidation on tab return
 */

export type ConnectionStatus = 'connected' | 'offline' | 'loading' | 'reconnecting';

export type ConnectionErrorType =
    | 'network'
    | 'auth'
    | 'schema'
    | 'timeout'
    | 'unknown';

export interface ConnectionState {
    status: ConnectionStatus;
    lastSuccessfulConnection: number | null;
    lastError: string | null;
    errorType: ConnectionErrorType | null;
    retryCount: number;
    consecutiveFailures: number;
    isBackgroundReconnecting: boolean;
}

export interface ConnectionConfig {
    initialTimeout: number;
    retryTimeout: number;
    maxRetries: number;
    retryDelay: number;
    baseBackoffInterval: number;
    maxBackoffInterval: number;
    consecutiveFailureThreshold: number;
    healthCheckInterval: number;
}

const DEFAULT_CONFIG: ConnectionConfig = {
    initialTimeout: 45000,
    retryTimeout: 20000,
    maxRetries: 3,
    retryDelay: 2000,
    baseBackoffInterval: 30000,       // 30s first retry (was 5 min)
    maxBackoffInterval: 300000,        // Cap at 5 min
    consecutiveFailureThreshold: 3,    // 3 failures before "offline"
    healthCheckInterval: 45000         // 45s health check
};

class ConnectionManager {
    private state: ConnectionState;
    private config: ConnectionConfig;
    private backgroundRetryTimer: ReturnType<typeof setTimeout> | null = null;
    private backgroundRetryAttempt: number = 0;
    private healthCheckTimer: ReturnType<typeof setInterval> | null = null;
    private healthCheckHandler: (() => Promise<boolean>) | null = null;
    private sessionRevalidator: (() => Promise<void>) | null = null;
    private listeners: Set<(state: ConnectionState) => void> = new Set();
    private visibilityHandler: (() => void) | null = null;

    constructor(config?: Partial<ConnectionConfig>) {
        this.config = { ...DEFAULT_CONFIG, ...config };

        const cached = this.loadCachedState();
        this.state = cached || {
            status: 'loading',
            lastSuccessfulConnection: null,
            lastError: null,
            errorType: null,
            retryCount: 0,
            consecutiveFailures: 0,
            isBackgroundReconnecting: false
        };

        // Set up tab visibility listener
        if (typeof document !== 'undefined') {
            this.visibilityHandler = () => {
                if (document.visibilityState === 'visible') {
                    this.onTabVisible();
                }
            };
            document.addEventListener('visibilitychange', this.visibilityHandler);
        }

        if (this.state.status === 'connected') {
            this.startHealthCheck();
        }
    }

    /**
     * Register a health check handler (called by database.ts)
     */
    setHealthCheckHandler(handler: () => Promise<boolean>) {
        this.healthCheckHandler = handler;
    }

    /**
     * Register a session revalidation handler (called by database.ts)
     */
    setSessionRevalidator(handler: () => Promise<void>) {
        this.sessionRevalidator = handler;
    }

    /**
     * Called when the browser tab becomes visible again.
     * Immediately revalidates session and checks connection health.
     */
    private async onTabVisible() {
        // Revalidate auth session
        if (this.sessionRevalidator) {
            try {
                await this.sessionRevalidator();
            } catch (e) {
                console.warn('[ConnectionManager] Session revalidation failed on tab return:', e);
            }
        }

        // Immediate health check (don't wait for next interval)
        if (this.healthCheckHandler && this.state.status !== 'reconnecting') {
            try {
                const isHealthy = await this.healthCheckHandler();
                if (isHealthy) {
                    this.state.consecutiveFailures = 0;
                    if (this.state.status !== 'connected') {
                        this.markConnected();
                    } else {
                        this.state.lastSuccessfulConnection = Date.now();
                        this.cacheState();
                    }
                } else {
                    this.incrementConsecutiveFailure();
                }
            } catch {
                this.incrementConsecutiveFailure();
            }
        }
    }

    /**
     * Increment consecutive failure count.
     * Only transition to "offline" after threshold is reached.
     */
    private incrementConsecutiveFailure() {
        this.state.consecutiveFailures++;
        if (this.state.consecutiveFailures >= this.config.consecutiveFailureThreshold) {
            if (this.state.status !== 'offline' && this.state.status !== 'reconnecting') {
                this.markFailed(new Error('Connection lost (multiple consecutive health check failures)'));
            }
        }
    }

    /**
     * Start health check polling (only when connected)
     */
    startHealthCheck() {
        if (this.healthCheckTimer) return;

        this.healthCheckTimer = setInterval(async () => {
            // Skip if already reconnecting or page is hidden
            if (this.state.status === 'reconnecting' || this.state.isBackgroundReconnecting) return;
            if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;

            if (this.healthCheckHandler) {
                try {
                    const isHealthy = await this.healthCheckHandler();
                    if (isHealthy) {
                        this.state.consecutiveFailures = 0;
                        this.state.lastSuccessfulConnection = Date.now();
                        this.cacheState();
                    } else {
                        this.incrementConsecutiveFailure();
                    }
                } catch {
                    this.incrementConsecutiveFailure();
                }
            }
        }, this.config.healthCheckInterval);
    }

    /**
     * Stop health check polling
     */
    stopHealthCheck() {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
            this.healthCheckTimer = null;
        }
    }

    /**
     * Get current connection state (copy)
     */
    getState(): ConnectionState {
        return { ...this.state };
    }

    /**
     * Subscribe to connection state changes
     */
    subscribe(listener: (state: ConnectionState) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private updateState(updates: Partial<ConnectionState>) {
        this.state = { ...this.state, ...updates };
        this.cacheState();
        this.notifyListeners();
    }

    private notifyListeners() {
        this.listeners.forEach(listener => listener(this.state));
    }

    private cacheState() {
        try {
            const cacheData = {
                lastSuccessfulConnection: this.state.lastSuccessfulConnection,
                status: this.state.status === 'connected' ? 'connected' : 'offline'
            };
            localStorage.setItem('gsl_connection_state', JSON.stringify(cacheData));
        } catch (e) {
            // Ignore
        }
    }

    private loadCachedState(): ConnectionState | null {
        try {
            const cached = localStorage.getItem('gsl_connection_state');
            if (!cached) return null;

            const data = JSON.parse(cached);
            return {
                status: 'loading',
                lastSuccessfulConnection: data.lastSuccessfulConnection,
                lastError: null,
                errorType: null,
                retryCount: 0,
                consecutiveFailures: 0,
                isBackgroundReconnecting: false
            };
        } catch (e) {
            return null;
        }
    }

    private categorizeError(error: any): ConnectionErrorType {
        const message = error?.message?.toLowerCase() || '';

        if (message.includes('timeout') || message.includes('timed out')) return 'timeout';
        if (message.includes('paused') || message.includes('503') || message.includes('disabled')) return 'network';
        if (message.includes('auth') || message.includes('unauthorized') || message.includes('invalid') || message.includes('credentials')) return 'auth';
        if (message.includes('table') || message.includes('schema') || message.includes('relation') || message.includes('does not exist')) return 'schema';
        if (message.includes('network') || message.includes('fetch') || message.includes('cors')) return 'network';

        return 'unknown';
    }

    getErrorMessage(errorType: ConnectionErrorType, originalError?: string): string {
        switch (errorType) {
            case 'timeout':
                return 'Connection timed out. Database may be sleeping (cold start) or network is slow.';
            case 'auth':
                return 'Authentication failed. Please check your Supabase credentials in the .env file.';
            case 'schema':
                return 'Database schema error. Please run migrations or check that all required tables exist.';
            case 'network':
                if (originalError?.toLowerCase().includes('paused')) {
                    return 'Database project is paused due to inactivity. Access the Supabase dashboard to restore it.';
                }
                return 'Network error. Please check your internet connection and firewall settings.';
            case 'unknown':
            default:
                return originalError || 'Failed to connect to database. Please check your configuration.';
        }
    }

    /**
     * Mark connection as successful
     */
    markConnected() {
        this.stopBackgroundReconnection();
        this.startHealthCheck();
        this.updateState({
            status: 'connected',
            lastSuccessfulConnection: Date.now(),
            lastError: null,
            errorType: null,
            retryCount: 0,
            consecutiveFailures: 0,
            isBackgroundReconnecting: false
        });
    }

    /**
     * Mark connection as failed
     */
    markFailed(error: any) {
        this.stopHealthCheck();
        const errorType = this.categorizeError(error);
        const errorMessage = this.getErrorMessage(errorType, error?.message);

        this.updateState({
            status: 'offline',
            lastError: errorMessage,
            errorType,
            consecutiveFailures: 0,
            isBackgroundReconnecting: false
        });

        // Start background reconnection for recoverable errors
        if (errorType !== 'auth' && errorType !== 'schema') {
            this.startBackgroundReconnection();
        }
    }

    markLoading() {
        this.updateState({ status: 'loading' });
    }

    markReconnecting() {
        this.updateState({ status: 'reconnecting' });
    }

    incrementRetry() {
        this.updateState({ retryCount: this.state.retryCount + 1 });
    }

    reset() {
        this.updateState({
            retryCount: 0,
            lastError: null,
            errorType: null,
            consecutiveFailures: 0
        });
    }

    shouldRetry(): boolean {
        return this.state.retryCount < this.config.maxRetries;
    }

    getTimeout(): number {
        return this.state.retryCount === 0
            ? this.config.initialTimeout
            : this.config.retryTimeout;
    }

    getRetryDelay(): number {
        return this.config.retryDelay * Math.pow(2, this.state.retryCount);
    }

    /**
     * Start background reconnection with escalating backoff:
     * 30s -> 60s -> 120s -> 300s (cap)
     */
    private startBackgroundReconnection() {
        if (this.backgroundRetryTimer) return;

        this.backgroundRetryAttempt = 0;
        this.updateState({ isBackgroundReconnecting: true });
        this.scheduleNextBackgroundRetry();
    }

    private scheduleNextBackgroundRetry() {
        const delay = Math.min(
            this.config.baseBackoffInterval * Math.pow(2, this.backgroundRetryAttempt),
            this.config.maxBackoffInterval
        );

        this.backgroundRetryTimer = setTimeout(async () => {
            this.backgroundRetryTimer = null;

            if (this.state.status === 'connected') {
                this.stopBackgroundReconnection();
                return;
            }

            if (this.healthCheckHandler) {
                try {
                    const isHealthy = await this.healthCheckHandler();
                    if (isHealthy) {
                        this.markConnected();
                        return;
                    }
                } catch {
                    // Still offline
                }
            }

            this.backgroundRetryAttempt++;
            this.scheduleNextBackgroundRetry();
        }, delay);
    }

    private stopBackgroundReconnection() {
        if (this.backgroundRetryTimer) {
            clearTimeout(this.backgroundRetryTimer);
            this.backgroundRetryTimer = null;
        }
        this.backgroundRetryAttempt = 0;
        if (this.state.isBackgroundReconnecting) {
            this.updateState({ isBackgroundReconnecting: false });
        }
    }

    triggerBackgroundReconnection() {
        this.stopBackgroundReconnection();
        this.startBackgroundReconnection();
    }

    destroy() {
        this.stopBackgroundReconnection();
        this.stopHealthCheck();
        if (this.visibilityHandler && typeof document !== 'undefined') {
            document.removeEventListener('visibilitychange', this.visibilityHandler);
        }
        this.listeners.clear();
    }
}

// Singleton instance
export const connectionManager = new ConnectionManager();
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds. The new `setSessionRevalidator` method matches what Task 4 wires up.

- [ ] **Step 3: Commit**

```bash
git add services/connectionManager.ts
git commit -m "fix: harden connectionManager with failure tolerance and faster recovery

- Require 3 consecutive health check failures before going offline
  (was: 1 failure = immediate offline)
- Escalating recovery backoff: 30s -> 60s -> 120s -> 300s cap
  (was: fixed 5-minute interval)
- Add visibilitychange listener: revalidate session + health check on tab return
- Add setSessionRevalidator for auth session revalidation"
```

---

## Task 6: Fix signOut cache cleanup

**Files:**
- Modify: `src/hooks/useAuth.ts`

- [ ] **Step 1: Replace signOut with correct cache cleanup**

In `src/hooks/useAuth.ts`, add the CacheService import at the top, after the existing imports:

```ts
import { CacheService } from '../modules/cache';
```

Then replace the `signOut` function with:

```ts
    const signOut = async () => {
        CacheService.clearAllMemory();
        localStorage.removeItem('gsl_connection_state');
        await dbService.signOut();
    };
```

The full file after changes:

```ts
import { useState, useEffect } from 'react';
import { User } from '../../types';
import { dbService } from '../../services/database';
import { CacheService } from '../modules/cache';

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const unsubscribe = dbService.onAuthStateChanged((userProfile) => {
            if (!isMounted) return;
            setUser(userProfile);
            setIsLoading(false);
        });
        return () => {
            isMounted = false;
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, []);

    const signOut = async () => {
        CacheService.clearAllMemory();
        localStorage.removeItem('gsl_connection_state');
        await dbService.signOut();
    };

    const toggleWishlist = async (productId: string) => {
        if (!user) {
            setIsLoginModalOpen(true);
            return;
        }

        const newWishlist = user.wishlist.includes(productId)
            ? user.wishlist.filter(id => id !== productId)
            : [...user.wishlist, productId];

        const previousWishlist = user.wishlist;
        setUser({ ...user, wishlist: newWishlist });

        try {
            await dbService.updateWishlist(user.uid, newWishlist);
        } catch (e) {
            console.warn("Wishlist sync failed, reverting", e);
            setUser({ ...user, wishlist: previousWishlist });
        }
    };

    return {
        user,
        setUser,
        isLoading,
        isLoginModalOpen,
        setIsLoginModalOpen,
        signOut,
        toggleWishlist
    };
};
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useAuth.ts
git commit -m "fix: signOut now clears all cached data correctly

Old code cleared keys starting with 'cache_' but actual cache keys
used 'gsl_cache_*' and 'gosimpleliving_cache_*' prefixes, so nothing
was cleared. Now uses CacheService.clearAllMemory() which clears all
gosimpleliving_cache_* keys, plus clears connection state."
```

---

## Task 7: Update AppContext to use forceRefresh and remove redundant cache saves

**Files:**
- Modify: `src/contexts/AppContext.tsx`

- [ ] **Step 1: Update refreshData to use forceRefresh**

In `src/contexts/AppContext.tsx`, update the `refreshData` function. Replace:

```ts
    const refreshData = async () => {
        try {
            connectionManager.markLoading();
            const [dbProducts, dbPosts, dbContent] = await Promise.all([
                dbService.getProducts(),
                dbService.getBlogPosts(),
                dbService.getSiteContent()
            ]);
```

With:

```ts
    const refreshData = async () => {
        try {
            connectionManager.markLoading();
            const [dbProducts, dbPosts, dbContent] = await Promise.all([
                dbService.getProducts(0, true),
                dbService.getBlogPosts(0, true),
                dbService.getSiteContent(true)
            ]);
```

- [ ] **Step 2: Remove redundant CacheService.save calls from refreshData**

In the same `refreshData` function, remove the `CacheService.save*` calls since the service layer now handles caching. Replace:

```ts
            if (dbProducts) {
                products.setProducts(dbProducts);
                CacheService.saveProducts(dbProducts);
            }
            if (dbPosts) {
                blog.setBlogPosts(dbPosts);
                CacheService.saveBlogs(dbPosts);
            }
            if (dbContent) {
                content.setLiveSiteContent(dbContent);
                CacheService.saveContent(dbContent);
            }
```

With:

```ts
            if (dbProducts) {
                products.setProducts(dbProducts);
            }
            if (dbPosts) {
                blog.setBlogPosts(dbPosts);
            }
            if (dbContent) {
                content.setLiveSiteContent(dbContent);
            }
```

- [ ] **Step 3: Remove redundant CacheService.save calls from loadData**

In the `loadData` function inside the `useEffect` (the background hydration block), apply the same change. Replace:

```ts
                if (dbProducts) {
                    products.setProducts(dbProducts);
                    CacheService.saveProducts(dbProducts); // Save new objects to memory
                }
                if (dbPosts) {
                    blog.setBlogPosts(dbPosts);
                    CacheService.saveBlogs(dbPosts); // Save new stories to memory
                }
                if (dbContent) {
                    content.setLiveSiteContent(dbContent);
                    CacheService.saveContent(dbContent); // Save new pictures to memory
                }
```

With:

```ts
                if (dbProducts) {
                    products.setProducts(dbProducts);
                }
                if (dbPosts) {
                    blog.setBlogPosts(dbPosts);
                }
                if (dbContent) {
                    content.setLiveSiteContent(dbContent);
                }
```

- [ ] **Step 4: Remove the CacheService import if no longer used**

Check if `CacheService` is still used in this file. The initial hydration lines at the top still use it:

```ts
const [initialCachedProducts] = useState(() => CacheService.loadProducts() || []);
const [initialCachedBlogs] = useState(() => CacheService.loadBlogs() || []);
const [initialCachedContent] = useState(() => CacheService.loadContent() || null);
```

These stay — they're the TTL-ignoring initial hydration reads. Keep the import.

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: Build succeeds. No TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add src/contexts/AppContext.tsx
git commit -m "fix: refreshData now bypasses cache with forceRefresh

- Pass forceRefresh=true so refresh fetches from Supabase, not cache
- Remove redundant CacheService.save* calls (service layer handles caching)
- Keep CacheService.load* for initial hydration (TTL-ignoring, instant UI)"
```

---

## Task 8: Clean up orphaned gsl_cache_* keys (one-time migration)

**Files:**
- Modify: `supabase/service.ts`

- [ ] **Step 1: Add a one-time cleanup at module load**

At the top of `supabase/service.ts`, after the imports, add a self-executing cleanup block that removes the orphaned `gsl_cache_*` keys left by the old inline cache:

```ts
// One-time cleanup: remove orphaned keys from the old inline cache layer.
// Safe to remove this block after one deploy cycle (all active users will have loaded it).
(() => {
    try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('gsl_cache_')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {
        // Ignore
    }
})();
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add supabase/service.ts
git commit -m "chore: one-time cleanup of orphaned gsl_cache_* localStorage keys

Removes leftover keys from the old inline cache layer. Safe to remove
this block after one deploy cycle."
```

---

## Task 9: Full build verification and manual testing

- [ ] **Step 1: Full clean build**

Run:

```bash
rm -rf dist
npm run build
```

Expected: Build succeeds with no errors. Check for warnings related to the modified files.

- [ ] **Step 2: Start dev server**

Run: `npm run dev`

Expected: Server starts on port 3000.

- [ ] **Step 3: Manual verification checklist**

Test each scenario in the browser at `http://localhost:3000`:

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 1 | Tab away/back | Navigate to site, switch to another tab for 1+ min, switch back | No "offline" flash, session intact, data refreshes |
| 2 | Brief network blip | Open DevTools > Network, toggle offline for 3s, toggle back | App stays "connected" (absorbed by failure threshold) |
| 3 | Extended offline | Toggle offline for 30s+ | App transitions to "offline," recovers within 30-60s after restoring network |
| 4 | Admin edit visibility | Edit a product in admin, navigate to shop | Edit visible immediately (cache invalidated) |
| 5 | Refresh button | Click refresh/reload data | Returns fresh data from Supabase, not cached |
| 6 | Logout clears data | Log in, browse products, log out, check DevTools > Application > localStorage | No `gosimpleliving_cache_*` keys remain, no `gsl_cache_*` keys remain |
| 7 | No orphaned keys | Check localStorage after browsing | Only `gosimpleliving_cache_*` keys (no `gsl_cache_*`) |

- [ ] **Step 4: Final commit (if any manual fixes needed)**

If manual testing reveals issues, fix them and commit with a descriptive message.

---

## Summary

| Task | Description | Files | Depends On |
|------|-------------|-------|------------|
| 1 | Remove fetchWithTimeout from Supabase client | `supabase/config.ts` | None |
| 2 | Extend CacheService with TTL and entity clearing | `src/modules/cache/*` | None |
| 3 | Replace inline cache with CacheService in service layer | `supabase/service.ts` | Task 2 |
| 4 | Update database interface and wire session revalidator | `services/database.ts` | Task 3, Task 5 |
| 5 | Harden ConnectionManager | `services/connectionManager.ts` | None |
| 6 | Fix signOut cache cleanup | `src/hooks/useAuth.ts` | Task 2 |
| 7 | Update AppContext for forceRefresh | `src/contexts/AppContext.tsx` | Task 3, Task 4 |
| 8 | Clean up orphaned gsl_cache_* keys | `supabase/service.ts` | Task 3 |
| 9 | Full build verification and manual testing | All | All |

**Parallel execution possible:** Tasks 1, 2, and 5 have no dependencies and can run concurrently.
