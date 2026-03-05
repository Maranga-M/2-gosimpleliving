
import { supabase } from './config';
import { User, Role, Product, BlogPost, SiteContent, AnalyticsEvent } from '../types';
import { ConnectionErrorType } from '../services/connectionManager';

const DB_NOT_CONFIGURED_ERROR = 'Database connection is not configured. Please set environment variables.';

// --- PERSISTENT CACHING STRATEGY ---
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes for persistent cache
const CACHE_KEYS = {
    products: 'gsl_cache_products',
    posts: 'gsl_cache_posts',
    siteContent: 'gsl_cache_site_content'
};

const saveToCache = (key: string, data: any) => {
    try {
        const cacheEntry = {
            data,
            timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(cacheEntry));
    } catch (e) {
        console.warn(`Failed to save to cache: ${key}`, e);
    }
};

const getFromCache = (key: string) => {
    try {
        const cached = localStorage.getItem(key);
        if (!cached) return null;

        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp > CACHE_TTL) {
            localStorage.removeItem(key);
            return null;
        }
        return data;
    } catch (e) {
        return null;
    }
};

// --- RETRY HELPER ---
const withRetry = async <T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> => {
    let lastError: any;
    for (let i = 0; i <= maxRetries; i++) {
        try {
            return await fn();
        } catch (err: any) {
            lastError = err;
            const isTransient = err.message?.includes('fetch') || err.message?.includes('network') || err.status === 502 || err.status === 503 || err.status === 504;
            if (!isTransient || i === maxRetries) throw err;
            const delay = 1000 * Math.pow(2, i);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw lastError;
};

export interface DetailedConnectionResult {
    success: boolean;
    errorType?: ConnectionErrorType;
    errorMessage?: string;
    details?: {
        canReachDatabase: boolean;
        hasValidCredentials: boolean;
        hasSiteContentTable: boolean;
        hasProductsTable: boolean;
        hasPostsTable: boolean;
    };
}

export const testConnection = async (): Promise<boolean> => {
    if (!supabase) return false;
    try {
        console.log("Supabase Service: testConnection START");
        // Lightweight query to check if connection is alive and site_content table is reachable
        // Using withRetry here to handle transient failures during the status check itself
        const result = await withRetry(async () => {
            const { error } = await supabase!.from('site_content').select('id').limit(1);
            if (error) throw error;
            return true;
        }, 2); // 2 dedicated retries for health check

        console.log("Supabase Service: testConnection END", { success: result });
        return result;
    } catch (e) {
        console.error("Supabase Service: testConnection EXCEPTION", e);
        return false;
    }
};

/**
 * Detailed connection test with specific error categorization
 */
export const testConnectionDetailed = async (): Promise<DetailedConnectionResult> => {
    if (!supabase) {
        return {
            success: false,
            errorType: 'auth',
            errorMessage: DB_NOT_CONFIGURED_ERROR
        };
    }

    const details = {
        canReachDatabase: false,
        hasValidCredentials: false,
        hasSiteContentTable: false,
        hasProductsTable: false,
        hasPostsTable: false
    };

    try {
        // Test 1: Can we reach the database at all?
        const { error: healthError } = await supabase.from('site_content').select('id').limit(1);

        if (healthError) {
            // Categorize the error
            const errorMsg = healthError.message.toLowerCase();

            if (errorMsg.includes('relation') || errorMsg.includes('does not exist') || errorMsg.includes('table')) {
                return {
                    success: false,
                    errorType: 'schema',
                    errorMessage: `Database table missing: ${healthError.message}. Please run migrations.`,
                    details
                };
            }

            if (errorMsg.includes('jwt') || errorMsg.includes('auth') || errorMsg.includes('unauthorized')) {
                return {
                    success: false,
                    errorType: 'auth',
                    errorMessage: 'Invalid Supabase credentials. Check your VITE_SUPABASE_ANON_KEY.',
                    details
                };
            }

            return {
                success: false,
                errorType: 'unknown',
                errorMessage: healthError.message,
                details
            };
        }

        details.canReachDatabase = true;
        details.hasValidCredentials = true;
        details.hasSiteContentTable = true;

        // Test 2: Check products table
        const { error: productsError } = await supabase.from('products').select('id').limit(1);
        details.hasProductsTable = !productsError;

        // Test 3: Check posts table
        const { error: postsError } = await supabase.from('posts').select('id').limit(1);
        details.hasPostsTable = !postsError;

        return {
            success: true,
            details
        };

    } catch (e: any) {
        const errorMsg = e?.message?.toLowerCase() || '';

        if (errorMsg.includes('fetch') || errorMsg.includes('network') || errorMsg.includes('cors')) {
            return {
                success: false,
                errorType: 'network',
                errorMessage: 'Network error. Check your internet connection and firewall settings.',
                details
            };
        }

        return {
            success: false,
            errorType: 'unknown',
            errorMessage: e?.message || 'Unknown connection error',
            details
        };
    }
};

// Map Supabase User to App User
const mapUser = (sbUser: any, profile: any): User => ({
    uid: sbUser.id,
    email: sbUser.email || '',
    name: profile?.name || sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || 'User',
    role: profile?.role || 'user',
    wishlist: profile?.wishlist || []
});

export const authStateChanged = (callback: (user: User | null) => void) => {
    if (!supabase) {
        callback(null);
        return () => { };
    }

    let initialCheckDone = false;

    // 1. Immediately check for existing session to prevent "guest flash" on refresh
    const initSession = async () => {
        try {
            const { data: { session } } = await supabase!.auth.getSession();
            if (session?.user) {
                const profile = await getUserProfile(session.user.id, session.user);
                if (profile) {
                    initialCheckDone = true;
                    callback(profile);
                } else if (session.user.email) {
                    initialCheckDone = true;
                    callback(mapUser(session.user, { role: 'user', wishlist: [], name: 'User' }));
                }
            } else {
                // Explicitly signal no session if we checked and found nothing
                initialCheckDone = true;
                callback(null);
            }
        } catch (e) {
            console.warn("Initial session check failed:", e);
            initialCheckDone = true;
            callback(null);
        }
    };

    initSession();

    // 2. Set up listener for subsequent changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log(`Supabase Auth Event: ${event}`);

        // If it's the initial check and we already handled it in initSession, skip redundant callback
        // This prevents double updates on first load
        if (event === 'INITIAL_SESSION' && initialCheckDone) {
            return;
        }

        if (session?.user) {
            // Background fetch for real profile/wishlist
            try {
                const profile = await getUserProfile(session.user.id, session.user);
                if (!profile && session.user.email) {
                    const initialName = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User';
                    await createUserProfile(session.user.id, session.user.email, initialName);
                    const newUser = mapUser(session.user, { role: 'user', wishlist: [], name: initialName });
                    callback(newUser);
                } else if (profile) {
                    if (session.user.email === 'admin@demo.com' && profile.role !== 'admin') {
                        try { await updateUserRole(profile.uid, 'admin'); } catch (e) { }
                        profile.role = 'admin';
                    }
                    callback(profile);
                }
            } catch (e) {
                console.warn("Auth listener profile fetch failed", e);
                const fallbackName = session.user.user_metadata?.name || 'User';
                callback(mapUser(session.user, { role: 'user', wishlist: [], name: fallbackName }));
            }
        } else {
            callback(null);
        }
    });
    return () => subscription.unsubscribe();
};

export const signIn = async (email: string, pass: string) => {
    if (!supabase) throw new Error(DB_NOT_CONFIGURED_ERROR);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) {
        console.error("Supabase Auth SignIn Error:", error);
        throw error;
    }
    return data.user;
};

export const signInWithGoogle = async () => {
    if (!supabase) throw new Error(DB_NOT_CONFIGURED_ERROR);
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin
        }
    });
    if (error) throw error;
    return data;
};

export const signUp = async (email: string, pass: string, name: string) => {
    if (!supabase) throw new Error(DB_NOT_CONFIGURED_ERROR);
    const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: { data: { name } }
    });
    if (error) throw error;
    try {
        if (data.user) {
            const { error: profileError } = await supabase.from('profiles').upsert([{ id: data.user.id, email, name, role: 'user', wishlist: [] }], { onConflict: 'id' });
            if (profileError) {
                console.error("SignUp Profile Table Error:", profileError.message);
                throw new Error(`Profile creation failed: ${profileError.message}. Ensure 'profiles' table exists in Supabase.`);
            }
        }
    } catch (e: any) {
        console.error("SignUp Extension Error:", e.message);
        throw e;
    }
    return data.user;
};

export const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
};

const createUserProfile = async (uid: string, email: string, name: string) => {
    if (!supabase) return;
    let role: Role = 'user';
    if (email.toLowerCase() === 'admin@demo.com') role = 'admin';
    try {
        await supabase.from('profiles').upsert([
            { id: uid, email, name, role, wishlist: [] }
        ], { onConflict: 'id' });
    } catch (e) { }
};

export const getUserProfile = async (uid: string, authUser?: any): Promise<User | null> => {
    if (!supabase) return null;
    try {
        const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', uid).single();
        if (error) return null;
        let user = authUser;
        if (!user) {
            const { data } = await supabase.auth.getUser();
            user = data.user;
        }
        return user ? mapUser(user, profile) : null;
    } catch (e) {
        return null;
    }
};

export const updateWishlist = async (uid: string, wishlist: string[]) => {
    if (!supabase) throw new Error(DB_NOT_CONFIGURED_ERROR);
    const { error } = await supabase.from('profiles').update({ wishlist }).eq('id', uid);
    if (error) {
        console.error("Supabase wishlist error:", error.message);
        throw error;
    }
};

export const updateUserName = async (uid: string, name: string) => {
    if (!supabase) throw new Error(DB_NOT_CONFIGURED_ERROR);
    const { error } = await supabase.from('profiles').update({ name }).eq('id', uid);
    if (error) {
        console.error("Supabase update name error:", error.message);
        throw error;
    }
};

export const getAllUsers = async (): Promise<User[]> => {
    if (!supabase) throw new Error(DB_NOT_CONFIGURED_ERROR);
    const { data: profiles, error } = await supabase.from('profiles').select('*').order('role', { ascending: true });
    if (error) throw error;
    return profiles.map(p => ({
        uid: p.id,
        name: p.name || 'Unknown',
        email: p.email || '',
        role: p.role || 'user',
        wishlist: p.wishlist || []
    }));
};

export const updateUserRole = async (uid: string, role: Role) => {
    if (!supabase) throw new Error(DB_NOT_CONFIGURED_ERROR);
    const { error } = await supabase.from('profiles').update({ role }).eq('id', uid);
    if (error) throw error;
};

export const deleteUser = async (uid: string) => {
    if (!supabase) throw new Error(DB_NOT_CONFIGURED_ERROR);
    const { error } = await supabase.from('profiles').delete().eq('id', uid);
    if (error) throw error;
};

export const requestPasswordReset = async (email: string, redirectTo?: string) => {
    if (!supabase) throw new Error(DB_NOT_CONFIGURED_ERROR);
    const { error } = await supabase.auth.resetPasswordForEmail(email, redirectTo ? { redirectTo } : undefined as any);
    if (error) throw error;
};

// --- CRUD WITH ERROR LOGGING ---

export const getProducts = async (): Promise<Product[] | null> => {
    if (!supabase) return null;

    const cached = getFromCache(CACHE_KEYS.products);
    if (cached) {
        console.log("Supabase Service: Returning cached products");
        return cached;
    }

    try {
        console.log("Supabase Service: getProducts START (Network)");
        const result = await withRetry(async () => {
            const { data, error } = await supabase!.from('products').select('*');
            if (error) throw error;
            return data;
        });

        const data = result || [];
        saveToCache(CACHE_KEYS.products, data);

        console.log("Supabase Service: getProducts END", { count: data.length });
        return data;
    } catch (e: any) {
        console.warn(`Supabase getProducts error:`, e.message);
        return null;
    }
};

export const getProductById = async (id: string): Promise<Product | null> => {
    if (!supabase) return null;
    try {
        const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
        if (error) throw error;
        return data;
    } catch (e: any) {
        console.warn(`Supabase getProductById error:`, e.message);
        return null;
    }
};

export const createProduct = async (product: Product) => {
    if (!supabase) throw new Error(DB_NOT_CONFIGURED_ERROR);
    const { error } = await supabase.from('products').insert(product);
    if (error) {
        console.error("Failed to CREATE product in DB:", {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        });
        throw new Error(`Database error: ${error.message}${error.code ? ` (${error.code})` : ''}`);
    }
};

export const updateProduct = async (product: Product) => {
    if (!supabase) throw new Error(DB_NOT_CONFIGURED_ERROR);
    const { error } = await supabase.from('products').update(product).eq('id', product.id);
    if (error) {
        console.error("Failed to UPDATE product in DB:", {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        });
        throw new Error(`Database error: ${error.message}${error.code ? ` (${error.code})` : ''}`);
    }
};

export const deleteProduct = async (id: string) => {
    if (!supabase) throw new Error(DB_NOT_CONFIGURED_ERROR);
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
        console.error("Failed to DELETE product from DB:", {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        });
        throw error;
    }
};

export const getBlogPosts = async (): Promise<BlogPost[] | null> => {
    if (!supabase) return null;

    const cached = getFromCache(CACHE_KEYS.posts);
    if (cached) {
        console.log("Supabase Service: Returning cached posts");
        return cached;
    }

    try {
        const result = await withRetry(async () => {
            const { data, error } = await supabase!.from('posts').select('*');
            if (error) throw error;
            return data;
        });

        const mappedPosts = (result || []).map((p: any) => ({
            ...p,
            heroImageUrl: p.hero_image_url,
            comparisonTables: p.comparison_tables || [],
            linkedProductIds: p.linkedProductIds || p.linked_product_ids || []
        }));

        saveToCache(CACHE_KEYS.posts, mappedPosts);

        return mappedPosts;
    } catch (e: any) {
        console.warn(`Supabase getBlogPosts error:`, e.message);
        return null;
    }
};

export const getBlogPostById = async (id: string): Promise<BlogPost | null> => {
    if (!supabase) return null;
    try {
        const { data, error } = await supabase.from('posts').select('*').eq('id', id).single();
        if (error) throw error;
        return {
            ...data,
            heroImageUrl: data.hero_image_url,
            comparisonTables: data.comparison_tables || [],
            linkedProductIds: data.linkedProductIds || data.linked_product_ids || []
        };
    } catch (e: any) {
        console.warn(`Supabase getBlogPostById error:`, e.message);
        return null;
    }
};

export const getBlogPostBySlug = async (slug: string): Promise<BlogPost | null> => {
    if (!supabase) return null;
    try {
        const { data, error } = await supabase.from('posts').select('*').eq('slug', slug).single();
        if (error) throw error;
        return {
            ...data,
            heroImageUrl: data.hero_image_url,
            comparisonTables: data.comparison_tables || [],
            linkedProductIds: data.linkedProductIds || data.linked_product_ids || []
        };
    } catch (e: any) {
        console.warn(`Supabase getBlogPostBySlug error:`, e.message);
        return null;
    }
};

export const createBlogPost = async (post: BlogPost) => {
    if (!supabase) throw new Error(DB_NOT_CONFIGURED_ERROR);

    // Map internal camelCase to DB snake_case
    const dbPost = {
        ...post,
        hero_image_url: post.heroImageUrl,
        comparison_tables: post.comparisonTables
    };
    // Remove camelCase keys
    delete (dbPost as any).heroImageUrl;
    delete (dbPost as any).comparisonTables;

    const { error } = await supabase.from('posts').insert(dbPost);
    if (error) throw error;
};

export const updateBlogPost = async (post: BlogPost) => {
    if (!supabase) throw new Error(DB_NOT_CONFIGURED_ERROR);

    // Map internal camelCase to DB snake_case
    const dbPost = {
        ...post,
        hero_image_url: post.heroImageUrl,
        comparison_tables: post.comparisonTables
    };
    // Remove camelCase keys
    delete (dbPost as any).heroImageUrl;
    delete (dbPost as any).comparisonTables;

    const { error } = await supabase.from('posts').update(dbPost).eq('id', post.id);
    if (error) throw error;
};

export const deleteBlogPost = async (id: string) => {
    if (!supabase) throw new Error(DB_NOT_CONFIGURED_ERROR);
    console.log(`Attempting to delete blog post with ID: ${id}`);
    const { error, data } = await supabase.from('posts').delete().eq('id', id);
    if (error) {
        console.error(`Failed to DELETE blog post from DB [${error.code}]:`, error.message);
        throw error;
    }
    console.log(`Successfully deleted blog post with ID: ${id}`, data);
};

export const getSiteContent = async (): Promise<SiteContent | null> => {
    if (!supabase) return null;

    const cached = getFromCache(CACHE_KEYS.siteContent);
    if (cached) {
        console.log("Supabase Service: Returning cached site content");
        return cached;
    }

    try {
        const result = await withRetry(async () => {
            const { data, error } = await supabase!.from('site_content').select('*').eq('id', 'main').single();
            if (error) throw error;
            return data;
        });

        const content = result?.content as SiteContent;
        
        // Validate and clean categories to prevent corruption
        if (content && content.categories) {
            content.categories = Array.from(new Set(content.categories.filter(c => c && typeof c === 'string')));
        }
        
        saveToCache(CACHE_KEYS.siteContent, content);

        return content;
    } catch (e: any) {
        console.warn(`Supabase getSiteContent error:`, e.message);
        return null;
    }
};

export const saveSiteContent = async (content: SiteContent) => {
    if (!supabase) throw new Error(DB_NOT_CONFIGURED_ERROR);
    
    // Deduplicate and clean categories before saving
    const cleanedContent = {
        ...content,
        categories: content.categories ? Array.from(new Set(content.categories.filter(c => c && typeof c === 'string'))) : []
    };
    
    const { error } = await supabase.from('site_content').upsert({
        id: 'main',
        content: cleanedContent
    });
    if (error) {
        console.error("Failed to SAVE site content to DB:", error.message);
        throw error;
    }

    // Update cache when we save, so we don't serve stale data for 30mins
    saveToCache(CACHE_KEYS.siteContent, cleanedContent);
};

export const seedDatabase = async (products: Product[], posts: BlogPost[], content: SiteContent) => {
    if (!supabase) throw new Error(DB_NOT_CONFIGURED_ERROR);
    const { error: prodError } = await supabase.from('products').upsert(products);
    if (prodError) throw prodError;
    const { error: postError } = await supabase.from('posts').upsert(posts);
    if (postError) throw postError;

    // Seed content
    await saveSiteContent(content);
};

export const logAnalyticsEvent = async (event: AnalyticsEvent) => {
    if (!supabase) return; // Fail silently
    try {
        await supabase.from('analytics').insert(event);
    } catch (e) { }
};

// --- STORAGE ---

export const uploadImage = async (base64: string, fileName: string): Promise<string | null> => {
    if (!supabase) throw new Error(DB_NOT_CONFIGURED_ERROR);

    const response = await fetch(base64);
    const blob = await response.blob();

    const { data, error } = await supabase
        .storage
        .from('media-assets')
        .upload(fileName, blob, {
            cacheControl: '3600',
            upsert: false,
            contentType: blob.type
        });

    if (error) throw error;

    const { data: publicUrlData } = supabase
        .storage
        .from('media-assets')
        .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
};

export const uploadFile = async (content: string, fileName: string, contentType: string): Promise<string | null> => {
    if (!supabase) throw new Error(DB_NOT_CONFIGURED_ERROR);
    try {
        const { data, error } = await supabase
            .storage
            .from('media-assets')
            .upload(fileName, content, {
                cacheControl: '3600',
                upsert: true,
                contentType: contentType
            });

        if (error) throw error;

        const { data: publicUrlData } = supabase
            .storage
            .from('media-assets')
            .getPublicUrl(data.path);

        return publicUrlData.publicUrl;

    } catch (error: any) {
        console.error("Error uploading file to Supabase Storage:", error.message);
        throw error;
    }
};

export const listImages = async (): Promise<{ name: string; url: string }[]> => {
    if (!supabase) return [];
    try {
        const { data, error } = await supabase
            .storage
            .from('media-assets')
            .list('', {
                limit: 100,
                offset: 0,
                sortBy: { column: 'created_at', order: 'desc' },
            });

        if (error) throw error;

        const client = supabase;
        const images = data.map(file => {
            const { data: publicUrlData } = client
                .storage
                .from('media-assets')
                .getPublicUrl(file.name);
            return {
                name: file.name,
                url: publicUrlData.publicUrl
            };
        });

        return images.filter(img => img.name.match(/\.(jpg|jpeg|png|gif|webp)$/i));

    } catch (error: any) {
        console.error("Error listing images:", error.message);
        return [];
    }
};

export const deleteImage = async (fileName: string) => {
    if (!supabase) throw new Error(DB_NOT_CONFIGURED_ERROR);
    const { error } = await supabase
        .storage
        .from('media-assets')
        .remove([fileName]);

    if (error) throw error;
};

