/** Entity prefixes for cache keys */
export type CacheEntityPrefix = 'products' | 'blogs' | 'content';

/** Cache keys: either a base entity key or a paginated variant */
export type CacheKey = CacheEntityPrefix | `${CacheEntityPrefix}_p${number}`;

/** What a cached item looks like in storage */
export interface CacheItem<T> {
    data: T;
    timestamp: number;
}
