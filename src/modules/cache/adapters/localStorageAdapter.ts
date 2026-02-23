import { CacheItem, CacheKey } from '../domain/entities';

// Prefix to make sure our lego pieces don't mix with other websites
const CACHE_PREFIX = 'gosimpleliving_cache_';

/**
 * Adapter to safely save and load from the browser memory (localStorage)
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
            console.warn(`[Cache Module] Could not save ${key} to memory. The box might be full!`, e);
        }
    },

    load<T>(key: CacheKey): T | null {
        try {
            const itemString = localStorage.getItem(`${CACHE_PREFIX}${key}`);
            if (!itemString) return null;

            const item = JSON.parse(itemString) as CacheItem<T>;
            return item.data;
        } catch (e) {
            console.warn(`[Cache Module] Could not load ${key} from memory. It might be broken!`, e);
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
