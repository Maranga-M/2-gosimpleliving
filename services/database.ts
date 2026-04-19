import * as supabaseService from '../supabase/service';
import { User, Role, Product, BlogPost, SiteContent, AnalyticsEvent } from '../types';

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

    // Products (Return null if connection failed/fallback needed)
    getProducts: (page?: number) => Promise<Product[] | null>;
    getProductById: (id: string) => Promise<Product | null>;
    createProduct: (product: Product) => Promise<void>;
    updateProduct: (product: Product) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;

    // Blog Posts
    getBlogPosts: (page?: number) => Promise<BlogPost[] | null>;
    getBlogPostById: (id: string) => Promise<BlogPost | null>;
    getBlogPostBySlug: (slug: string) => Promise<BlogPost | null>;
    createBlogPost: (post: BlogPost) => Promise<void>;
    updateBlogPost: (post: BlogPost) => Promise<void>;
    deleteBlogPost: (id: string) => Promise<void>;

    // Site Content (Theme, Hero, etc)
    getSiteContent: () => Promise<SiteContent | null>;
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
import { connectionManager } from './connectionManager';
connectionManager.setHealthCheckHandler(async () => {
    return await supabaseService.testConnection();
});
