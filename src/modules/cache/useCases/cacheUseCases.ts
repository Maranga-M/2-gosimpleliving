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
    },

    // --- Entity-specific save (for data persistence) ---

    saveProducts(products: Product[]): void {
        localStorageAdapter.save('products', products);
    },

    saveBlogs(blogs: BlogPost[]): void {
        localStorageAdapter.save('blogs', blogs);
    },

    saveContent(content: SiteContent): void {
        localStorageAdapter.save('content', content);
    }
};
