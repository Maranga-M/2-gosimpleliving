// The keys we use to save things in the safe browser memory
export type CacheKey = 'products' | 'blogs' | 'content';

// What the saved memory looks like
export interface CacheItem<T> {
    data: T;
    timestamp: number;
}
