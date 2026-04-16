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
