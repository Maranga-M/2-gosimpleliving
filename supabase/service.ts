import { supabase } from './config';
import { User, Role, Product, BlogPost, SiteContent, AnalyticsEvent } from '../types';
import { ConnectionErrorType } from '../services/connectionManager';
import { handleDbError } from '../src/utils/handleDbError';

const DB_NOT_CONFIGURED_ERROR = "Supabase is not configured. Please check your environment variables.";

export const getCachedProfile = (): User | null => {
    // Rely exclusively on auth state listeners or AppContext going forward.
    return null;
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
        const { error } = await supabase.from('site_content').select('id').limit(1);
        if (error) throw error;

        console.log("Supabase Service: testConnection END", { success: true });
        return true;
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

export const authStateChanged = (callback: (user: User | null, event?: string) => void) => {
    if (!supabase) {
        callback(null, 'INITIAL_SESSION');
        return () => { };
    }

    let refreshTimer: any = null;

    const setupRefreshBuffer = async () => {
        const { data: { session } } = await supabase!.auth.getSession();
        if (session && session.expires_at) {
            const expiresAt = session.expires_at * 1000;
            const now = Date.now();
            const buffer = 5 * 60 * 1000; // 5 minute buffer
            const waitTime = expiresAt - now - buffer;

            if (refreshTimer) clearTimeout(refreshTimer);
            if (waitTime > 0) {
                refreshTimer = setTimeout(async () => {
                    console.log("Supabase Auth: Proactive token refresh (5m buffer)");
                    await supabase!.auth.refreshSession();
                    setupRefreshBuffer();
                }, waitTime);
            }
        }
    };

    // 1. Immediately check for existing session
    const initSession = async () => {
        try {
            const { data: { session }, error: sessionError } = await supabase!.auth.getSession();
            if (sessionError || !session?.user) {
                callback(null, 'INITIAL_SESSION');
                return;
            }

            setupRefreshBuffer();
            const profile = await getUserProfile(session.user.id, session.user);
            if (profile) {
                callback(profile, 'INITIAL_SESSION');
            } else if (session.user.email) {
                const fallbackUser = mapUser(session.user, { role: 'user', wishlist: [], name: 'User' });
                callback(fallbackUser, 'INITIAL_SESSION');
            }
        } catch (e: any) {
            callback(null, 'INITIAL_SESSION');
        }
    };

    initSession();

    // 2. Set up listener for subsequent changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log(`Supabase Auth Event: ${event}`);

        if (session?.user) {
            setupRefreshBuffer();
            try {
                const profile = await getUserProfile(session.user.id, session.user);
                if (!profile && session.user.email) {
                    const initialName = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User';
                    await createUserProfile(session.user.id, session.user.email, initialName);
                    const newUser = mapUser(session.user, { role: 'user', wishlist: [], name: initialName });
                    callback(newUser, event);
                } else if (profile) {
                    callback(profile, event);
                }
            } catch (e) {
                const fallbackName = session.user.user_metadata?.name || 'User';
                const fallbackUser = mapUser(session.user, { role: 'user', wishlist: [], name: fallbackName });
                callback(fallbackUser, event);
            }
        } else {
            if (refreshTimer) clearTimeout(refreshTimer);
            if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
                callback(null, event);
            }
        }
    });

    return () => {
        if (refreshTimer) clearTimeout(refreshTimer);
        subscription.unsubscribe();
    };
};

export const signIn = async (email: string, pass: string) => {
    if (!supabase) throw new Error(DB_NOT_CONFIGURED_ERROR);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    return data.user;
};

export const signInWithProvider = async (provider: 'google' | 'github' | 'apple') => {
    if (!supabase) throw new Error(DB_NOT_CONFIGURED_ERROR);
    const redirectTo = `${window.location.origin}/`;
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo,
            queryParams: provider === 'google' ? { prompt: 'select_account' } : undefined
        }
    });
    if (error) throw error;
    return data;
};

export const sendMagicLink = async (email: string) => {
    if (!supabase) throw new Error(DB_NOT_CONFIGURED_ERROR);
    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            emailRedirectTo: `${window.location.origin}/`
        }
    });
    if (error) throw error;
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
            // Give Supabase a moment to establish the session before RLS check
            await new Promise(resolve => setTimeout(resolve, 1000));
            const { error: profileError } = await supabase.from('profiles').upsert([{ id: data.user.id, email, name, role: 'user', wishlist: [] }], { onConflict: 'id' });
            if (profileError) {
                console.error("SignUp Profile Table Error:", profileError.message);
                // If it fails, we don't necessarily want to block the whole signup if the user was created
                // but for this app it's critical for role management.
                if (profileError.message.includes('row-level security')) {
                    console.warn("RLS block detected - profile may need manual creation or fix in Supabase policies.");
                }
            }
        }
    } catch (e: any) {
        console.error("SignUp Extension Error:", e.message);
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

    // Call the SECURITY DEFINER function which deletes from BOTH
    // public.profiles AND auth.users. The anon client cannot touch
    // auth.users directly — this function runs with elevated privileges.
    const { error } = await supabase.rpc('delete_user_by_id', { target_uid: uid });

    if (error) {
        console.error('[deleteUser] Error:', error.message);
        throw new Error(error.message);
    }
};

export const requestPasswordReset = async (email: string, redirectTo?: string) => {
    if (!supabase) throw new Error(DB_NOT_CONFIGURED_ERROR);
    const { error } = await supabase.auth.resetPasswordForEmail(email, redirectTo ? { redirectTo } : undefined as any);
    if (error) throw error;
};

// --- CRUD WITH ERROR LOGGING ---

export const getProducts = async (): Promise<Product[] | null> => {
    if (!supabase) return null;

    try {
        console.log("Supabase Service: getProducts START (Network)");
        const { data, error } = await supabase.from('products').select('*');
        if (error) throw error;

        const productsData = data || [];
        console.log("Supabase Service: getProducts END", { count: productsData.length });
        return productsData;
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

    // Build clean DB row (strip extra frontend-only fields like regionalPricing)
    const dbProduct = {
        id: product.id,
        title: product.title,
        category: product.category,
        price: product.price,
        originalPrice: product.originalPrice,
        rating: product.rating,
        reviews: product.reviews,
        image: product.image,
        description: product.description,
        features: product.features,
        affiliateLink: product.affiliateLink,
        affiliateLinkLabel: product.affiliateLinkLabel,
        affiliateLinkTheme: product.affiliateLinkTheme,
        isBestSeller: product.isBestSeller,
        status: product.status,
        clicks: product.clicks || 0,
        localReviews: product.localReviews || [],
        regionalPricing: product.regionalPricing || {},
        additionalAffiliateLinks: product.additionalAffiliateLinks || [],
        cjAffiliateId: product.cjAffiliateId,
        cjDeepLink: product.cjDeepLink
    };

    const { error } = await supabase.from('products').insert(dbProduct);
    if (error) {
        console.error("Failed to CREATE product in DB:", error.message);
        await handleDbError(error);
        throw error;
    }
};

export const updateProduct = async (product: Product) => {
    if (!supabase) throw new Error(DB_NOT_CONFIGURED_ERROR);

    // Build clean DB row (strip extra frontend-only fields like regionalPricing)
    const dbProduct = {
        title: product.title,
        category: product.category,
        price: product.price,
        originalPrice: product.originalPrice,
        rating: product.rating,
        reviews: product.reviews,
        image: product.image,
        description: product.description,
        features: product.features,
        affiliateLink: product.affiliateLink,
        affiliateLinkLabel: product.affiliateLinkLabel,
        affiliateLinkTheme: product.affiliateLinkTheme,
        isBestSeller: product.isBestSeller,
        status: product.status,
        clicks: product.clicks || 0,
        localReviews: product.localReviews || [],
        regionalPricing: product.regionalPricing || {},
        additionalAffiliateLinks: product.additionalAffiliateLinks || [],
        cjAffiliateId: product.cjAffiliateId,
        cjDeepLink: product.cjDeepLink
    };

    const { error } = await supabase.from('products').update(dbProduct).eq('id', product.id);
    if (error) {
        console.error("Failed to UPDATE product in DB:", error.message);
        await handleDbError(error);
        throw error;
    }
};

export const deleteProduct = async (id: string) => {
    if (!supabase) throw new Error(DB_NOT_CONFIGURED_ERROR);
    const { error } = await supabase.from('products').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) {
        console.error("Failed to SOFT DELETE product in DB:", error.message);
        await handleDbError(error);
        throw error;
    }
};

export const restoreProduct = async (id: string) => {
    if (!supabase) throw new Error(DB_NOT_CONFIGURED_ERROR);
    const { error } = await supabase.from('products').update({ deleted_at: null }).eq('id', id);
    if (error) throw error;
};

export const duplicateProduct = async (id: string): Promise<string> => {
    if (!supabase) throw new Error(DB_NOT_CONFIGURED_ERROR);
    const product = await getProductById(id);
    if (!product) throw new Error("Product not found");

    const newId = crypto.randomUUID();
    const duplicated: Product = {
        ...product,
        id: newId,
        title: `${product.title} (Copy)`,
        status: 'draft',
        clicks: 0,
        deleted_at: undefined
    };

    await createProduct(duplicated);
    return newId;
};

export const getBlogPosts = async (): Promise<BlogPost[] | null> => {
    if (!supabase) return null;

    try {
        const { data, error } = await supabase.from('posts').select('*');
        if (error) throw error;

        const mappedPosts = (data || []).map((p: any) => ({
            ...p,
            heroImageUrl: p.hero_image_url,
            comparisonTables: p.comparison_tables || [],
            linkedProductIds: p.linkedProductIds || p.linked_product_ids || []
        }));

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

    // Build a clean DB row with all snake_case conversions
    const dbPost: Record<string, any> = {
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        author: post.author,
        date: post.date,
        category: post.category,
        image: post.image,
        status: post.status,
        focus_keyword: post.focusKeyword,
        meta_title: post.metaTitle,
        meta_description: post.metaDescription,
        meta_keywords: post.metaKeywords,
        hero_image_url: post.heroImageUrl,
        comparison_tables: post.comparisonTables ?? null,
        linked_product_ids: post.linkedProductIds ?? [],
    };

    const { error } = await supabase.from('posts').insert(dbPost);
    if (error) {
        console.error('[createBlogPost] Supabase insert error:', error);
        await handleDbError(error);
        throw new Error(error.message);
    }
};

export const updateBlogPost = async (post: BlogPost) => {
    if (!supabase) throw new Error(DB_NOT_CONFIGURED_ERROR);

    // Build a clean DB row with all snake_case conversions
    const dbPost: Record<string, any> = {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        author: post.author,
        date: post.date,
        category: post.category,
        image: post.image,
        status: post.status,
        focus_keyword: post.focusKeyword,
        meta_title: post.metaTitle,
        meta_description: post.metaDescription,
        meta_keywords: post.metaKeywords,
        hero_image_url: post.heroImageUrl,
        comparison_tables: post.comparisonTables ?? null,
        linked_product_ids: post.linkedProductIds ?? [],
    };

    const { error } = await supabase.from('posts').update(dbPost).eq('id', post.id);
    if (error) {
        console.error('[updateBlogPost] Supabase update error:', error);
        await handleDbError(error);
        throw new Error(error.message);
    }
};

export const deleteBlogPost = async (id: string) => {
    if (!supabase) throw new Error(DB_NOT_CONFIGURED_ERROR);
    const { error } = await supabase.from('posts').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) {
        console.error(`Failed to SOFT DELETE blog post from DB:`, error.message);
        await handleDbError(error);
        throw error;
    }
};

export const restoreBlogPost = async (id: string) => {
    if (!supabase) throw new Error(DB_NOT_CONFIGURED_ERROR);
    const { error } = await supabase.from('posts').update({ deleted_at: null }).eq('id', id);
    if (error) throw error;
};

export const duplicateBlogPost = async (id: string): Promise<string> => {
    if (!supabase) throw new Error(DB_NOT_CONFIGURED_ERROR);
    const post = await getBlogPostById(id);
    if (!post) throw new Error("Blog post not found");

    const newId = crypto.randomUUID();
    const duplicated: BlogPost = {
        ...post,
        id: newId,
        title: `${post.title} (Copy)`,
        status: 'draft',
        date: new Date().toISOString().split('T')[0],
        deleted_at: undefined
    };

    await createBlogPost(duplicated);
    return newId;
};

export const getSiteContent = async (): Promise<SiteContent | null> => {
    if (!supabase) return null;

    try {
        const { data, error } = await supabase.from('site_content').select('*').eq('id', 'main').single();
        if (error) throw error;

        return data?.content as SiteContent;
    } catch (e: any) {
        console.warn(`Supabase getSiteContent error:`, e.message);
        return null;
    }
};

export const saveSiteContent = async (content: SiteContent) => {
    if (!supabase) throw new Error(DB_NOT_CONFIGURED_ERROR);
    const { error } = await supabase.from('site_content').upsert({
        id: 'main',
        content: content
    });
    if (error) {
        console.error("Failed to SAVE site content to DB:", error.message);
        await handleDbError(error);
        throw error;
    }
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
            cacheControl: '31536000', // 1 year
            upsert: true,
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
                cacheControl: '31536000', // 1 year
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

/**
 * Helper to get optimized image URLs from Supabase Storage
 * Supports resizing, quality, and automatic WebP conversion
 */
export const getOptimizedUrl = (url: string | undefined, options: { width?: number; height?: number; quality?: number } = {}) => {
    if (!url) return '';
    if (!url.includes('supabase.co/storage/v1/object/public/')) return url;

    const params = new URLSearchParams();
    if (options.width) params.append('width', options.width.toString());
    if (options.height) params.append('height', options.height.toString());
    params.append('quality', (options.quality || 80).toString());
    params.append('format', 'origin'); // Supabase handles WebP automatically if format is omitted or set correctly

    return `${url}?${params.toString()}`;
};

