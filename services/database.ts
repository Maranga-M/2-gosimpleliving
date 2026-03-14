import * as supabaseService from '../supabase/service';
import { User, Role, Product, BlogPost, SiteContent, AnalyticsEvent } from '../types';

export interface DatabaseService {
    signIn: (email: string, pass: string) => Promise<any>;
    signInWithGoogle: () => Promise<any>;
    signInWithGitHub: () => Promise<any>;
    sendMagicLink: (email: string) => Promise<void>;
    signUp: (email: string, pass: string, name: string) => Promise<any>;
    signOut: () => Promise<void>;
    onAuthStateChanged: (callback: (user: User | null, event?: string) => void) => Function;
    testConnection: () => Promise<boolean>;
    testConnectionDetailed: () => Promise<any>;
    updateWishlist: (uid: string, wishlist: string[]) => Promise<void>;
    updateUserName: (uid: string, name: string) => Promise<void>;
    getAllUsers: () => Promise<User[]>;
    updateUserRole: (uid: string, role: Role) => Promise<void>;
    deleteUser: (uid: string) => Promise<void>;
    requestPasswordReset: (email: string, redirectTo?: string) => Promise<void>;
    seedDatabase: (products: Product[], posts: BlogPost[], content: SiteContent) => Promise<void>;
    getCachedProfile: () => User | null;

    // Products (Return null if connection failed/fallback needed)
    getProducts: () => Promise<Product[] | null>;
    getProductById: (id: string) => Promise<Product | null>;
    createProduct: (product: Product) => Promise<void>;
    updateProduct: (product: Product) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;
    duplicateProduct: (id: string) => Promise<string>;
    restoreProduct: (id: string) => Promise<void>;

    // Blog Posts
    getBlogPosts: () => Promise<BlogPost[] | null>;
    getBlogPostById: (id: string) => Promise<BlogPost | null>;
    getBlogPostBySlug: (slug: string) => Promise<BlogPost | null>;
    createBlogPost: (post: BlogPost) => Promise<void>;
    updateBlogPost: (post: BlogPost) => Promise<void>;
    deleteBlogPost: (id: string) => Promise<void>;
    duplicateBlogPost: (id: string) => Promise<string>;
    restoreBlogPost: (id: string) => Promise<void>;

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
}



export const dbService: DatabaseService = {
    signIn: supabaseService.signIn,
    signInWithGoogle: () => supabaseService.signInWithProvider('google'),
    signInWithGitHub: () => supabaseService.signInWithProvider('github'),
    sendMagicLink: supabaseService.sendMagicLink,
    signUp: supabaseService.signUp,
    signOut: supabaseService.signOut,
    onAuthStateChanged: supabaseService.authStateChanged,
    testConnection: supabaseService.testConnection,
    testConnectionDetailed: supabaseService.testConnectionDetailed,
    // The original onAuthStateChanged implementation was:
    // onAuthStateChanged: (callback) => {
    //     return supabaseService.authStateChanged((user) => {
    //         callback(user);
    //     });
    // },

    updateWishlist: supabaseService.updateWishlist,
    updateUserName: supabaseService.updateUserName,
    getAllUsers: supabaseService.getAllUsers,
    updateUserRole: supabaseService.updateUserRole,
    deleteUser: supabaseService.deleteUser,
    requestPasswordReset: supabaseService.requestPasswordReset,
    seedDatabase: supabaseService.seedDatabase,
    getCachedProfile: supabaseService.getCachedProfile,

    // Products
    getProducts: supabaseService.getProducts,
    getProductById: supabaseService.getProductById,
    createProduct: async (product) => {
        await supabaseService.createProduct(product);
    },
    updateProduct: async (product) => {
        await supabaseService.updateProduct(product);
    },
    deleteProduct: async (id) => {
        await supabaseService.deleteProduct(id);
    },
    duplicateProduct: supabaseService.duplicateProduct,
    restoreProduct: supabaseService.restoreProduct,

    // Blog Posts
    getBlogPosts: supabaseService.getBlogPosts,
    getBlogPostById: supabaseService.getBlogPostById,
    getBlogPostBySlug: supabaseService.getBlogPostBySlug,
    createBlogPost: async (post) => {
        await supabaseService.createBlogPost(post);
    },
    updateBlogPost: async (post) => {
        await supabaseService.updateBlogPost(post);
    },
    deleteBlogPost: async (id) => {
        await supabaseService.deleteBlogPost(id);
    },
    duplicateBlogPost: supabaseService.duplicateBlogPost,
    restoreBlogPost: supabaseService.restoreBlogPost,

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
};


