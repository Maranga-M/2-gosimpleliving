import { localStorageAdapter } from '../adapters/localStorageAdapter';
import { Product, BlogPost, SiteContent } from '../../../../types';

/**
 * Use Cases: What this module can DO.
 * We use an adapter so we can change where we save things later if we want!
 */
export const ObjectCacheService = {

    // --- Save Use Cases ---
    saveProducts(products: Product[]): void {
        localStorageAdapter.save('products', products);
    },

    saveBlogs(blogs: BlogPost[]): void {
        localStorageAdapter.save('blogs', blogs);
    },

    saveContent(content: SiteContent): void {
        localStorageAdapter.save('content', content);
    },

    // --- Load Use Cases ---
    loadProducts(): Product[] | null {
        return localStorageAdapter.load<Product[]>('products');
    },

    loadBlogs(): BlogPost[] | null {
        return localStorageAdapter.load<BlogPost[]>('blogs');
    },

    loadContent(): SiteContent | null {
        return localStorageAdapter.load<SiteContent>('content');
    },

    // --- Clear Use Cases ---
    clearAllMemory(): void {
        localStorageAdapter.clearAll();
    }
};
