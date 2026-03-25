import React, { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { useProducts } from '../hooks/useProducts';
import { useBlogPosts } from '../hooks/useBlogPosts';
import { useSiteContent } from '../hooks/useSiteContent';
import { useUsers } from '../hooks/useUsers';
import { useRealtime } from '../hooks/useRealtime';
import { dbService } from '../../services/database';
import { connectionManager, ConnectionStatus } from '../../services/connectionManager';
import { AppNotification, Product, BlogPost, SiteContent } from '../../types';
import { generatePersonalizedAlerts } from '../../services/geminiService';
import { CacheService } from '../modules/cache';

// Define the shape of our context
interface AppContextType {
    auth: ReturnType<typeof useAuth>;
    products: ReturnType<typeof useProducts>;
    blog: ReturnType<typeof useBlogPosts>;
    content: ReturnType<typeof useSiteContent>;
    users: ReturnType<typeof useUsers>;

    // Connection State
    dbStatus: ConnectionStatus;
    lastError: string | null;
    isUsingFallback: boolean;

    // UI State
    isDarkMode: boolean;
    toggleDarkMode: () => void;

    // Notifications
    notifications: AppNotification[];
    markNotificationRead: (id: string) => void;
    clearAllNotifications: () => void;

    // Refresh Data
    refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // --- Dark Mode ---
    const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
        const saved = localStorage.getItem('gsl_dark_mode');
        if (saved !== null) return saved === 'true';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        if (isDarkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        localStorage.setItem('gsl_dark_mode', String(isDarkMode));
    }, [isDarkMode]);

    const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

    // --- Data Loading: Initial Sync Cache ---
    // Loading from cache directly into state on first render prevents blank flashes
    const [initialCachedProducts] = useState(() => CacheService.loadProducts() || []);
    const [initialCachedBlogs] = useState(() => CacheService.loadBlogs() || []);
    const [initialCachedContent] = useState(() => CacheService.loadContent() || null);

    // --- Hooks ---
    const auth = useAuth();
    const content = useSiteContent(auth.user?.role, initialCachedContent);

    // Database Status State - Driven by connectionManager
    const [dbStatus, setDbStatus] = useState<ConnectionStatus>(connectionManager.getState().status);
    const [lastError, setLastError] = useState<string | null>(connectionManager.getState().lastError);
    const [isUsingFallback, setIsUsingFallback] = useState(false);

    // Sync state with connectionManager
    useEffect(() => {
        const unsubscribe = connectionManager.subscribe((state) => {
            setDbStatus(state.status);
            setLastError(state.lastError);
            if (state.status === 'offline') setIsUsingFallback(true);
            if (state.status === 'connected') setIsUsingFallback(false);
        });
        return unsubscribe;
    }, []);

    // --- Health Check / Heartbeat ---
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;

        const checkHealth = async () => {
            const currentStatus = connectionManager.getState().status;
            if (currentStatus === 'connected') {
                const isHealthy = await dbService.testConnection();
                if (!isHealthy) {
                    console.warn('[Heartbeat] Connection lost. Running detailed diagnostics...');
                    const diagnostic = await dbService.testConnectionDetailed();
                    console.error('[Heartbeat] Diagnostic Result:', diagnostic);
                    connectionManager.markFailed(new Error(diagnostic.errorMessage || "Connection lost."));
                }
            } else if (currentStatus === 'offline') {
                // Don't auto-retry if it's a known non-recoverable error type like Auth or Schema
                const errorType = connectionManager.getState().errorType;
                if (errorType !== 'auth' && errorType !== 'schema') {
                    const isHealthy = await dbService.testConnection();
                    if (isHealthy) {
                        console.log('[Heartbeat] Connection restored!');
                        toast.success('Database connection restored');
                        connectionManager.markConnected();
                    }
                }
            }

            // Adaptive polling: 15s if offline trying to recover, 2m if healthy
            const nextInterval = connectionManager.getState().status === 'offline' ? 15000 : 120000;
            timer = setTimeout(checkHealth, nextInterval);
        };

        timer = setTimeout(checkHealth, 120000);
        return () => clearTimeout(timer);
    }, []);

    // We initialize hooks with initial cached data so UI renders immediately
    const products = useProducts(dbStatus, auth.user?.role, content.siteContent.categories, initialCachedProducts, auth.setIsLoginModalOpen);
    const blog = useBlogPosts(initialCachedBlogs, auth.user?.role, auth.setIsLoginModalOpen);

    // Background data hydration (non-blocking)
    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>;
        const loadData = async () => {
            // 60s timeout to handle Supabase cold starts (Free Tier pauses)
            const timeout = 60000;
            const attemptTimeoutPromise = new Promise<never>((_, reject) => {
                timeoutId = setTimeout(() => {
                    reject(new Error(`Database wakeup timeout (${timeout / 1000}s). This is common for free-tier projects warming up.`));
                }, timeout);
            });

            try {
                connectionManager.markLoading();

                // 3 reads only — a null return signals a failed connection (no separate testConnection ping needed)
                const [dbProducts, dbPosts, dbContent] = await Promise.race([
                    Promise.all([
                        dbService.getProducts(),
                        dbService.getBlogPosts(),
                        dbService.getSiteContent()
                    ]),
                    attemptTimeoutPromise
                ]) as [Product[] | null, BlogPost[] | null, SiteContent | null];

                clearTimeout(timeoutId);

                if (dbProducts === null || dbPosts === null) {
                    const diagnostic = await dbService.testConnectionDetailed();
                    if (!diagnostic.success) {
                        throw new Error(diagnostic.errorMessage || "Failed to load data from database.");
                    } else {
                        throw new Error("Failed to load data from database. Network issue or server sleeping.");
                    }
                }

                connectionManager.markConnected();

                products.setProducts(dbProducts);
                CacheService.saveProducts(dbProducts);

                blog.setBlogPosts(dbPosts);
                CacheService.saveBlogs(dbPosts);

                if (dbContent) {
                    content.setLiveSiteContent(dbContent);
                    CacheService.saveContent(dbContent);
                }

            } catch (e: any) {
                clearTimeout(timeoutId);
                console.warn(`[Background Hydration] Failed:`, e.message);
                connectionManager.markFailed(e);
            }
        };

        loadData();

        return () => {
            clearTimeout(timeoutId);
        };
    }, [auth.user?.role]); // Re-fetch on auth change (admin might see more)

    const refreshData = async () => {
        try {
            connectionManager.markLoading();
            // 3 reads only — null return signals failure, no separate ping needed
            const [dbProducts, dbPosts, dbContent] = await Promise.all([
                dbService.getProducts(),
                dbService.getBlogPosts(),
                dbService.getSiteContent()
            ]);

            if (dbProducts === null || dbPosts === null) {
                const diagnostic = await dbService.testConnectionDetailed();
                if (!diagnostic.success) {
                    throw new Error(diagnostic.errorMessage || "Failed to load core data.");
                } else {
                    throw new Error("Database responded but failed to return core data.");
                }
            }

            products.setProducts(dbProducts);
            CacheService.saveProducts(dbProducts);

            blog.setBlogPosts(dbPosts);
            CacheService.saveBlogs(dbPosts);

            if (dbContent) {
                content.setLiveSiteContent(dbContent);
                CacheService.saveContent(dbContent);
            }

            connectionManager.markConnected();
            toast.success("Successfully synced with Cloud Database!");
        } catch (e: any) {
            console.error("Manual refresh failed:", e);
            connectionManager.markFailed(e);
            toast.error(e.message || "Cloud Refresh Failed. Using local fallback.");
        }
    };

    // --- Realtime Subscriptions ---
    // When the DB is connected, subscribe to live changes so the UI
    // auto-refreshes without needing a manual page reload.
    useRealtime({
        onProductChange: (product, eventType) => {
            products.setProducts(prev => {
                if (eventType === 'DELETE') return prev.filter(p => p.id !== product.id);
                if (eventType === 'INSERT') return [...prev, product];
                return prev.map(p => p.id === product.id ? product : p); // UPDATE
            });
        },
        onPostChange: (post, eventType) => {
            blog.setBlogPosts(prev => {
                if (eventType === 'DELETE') return prev.filter(p => p.id !== post.id);
                if (eventType === 'INSERT') return [...prev, post];
                return prev.map(p => p.id === post.id ? post : p); // UPDATE
            });
        },
        onSiteContentChange: (liveContent) => {
            content.setLiveSiteContent(liveContent);
            CacheService.saveContent(liveContent);
        },
        onAnalyticsInsert: () => {
            // Signal the dashboard to refetch analytics summary
            console.log('[Realtime] Analytics event received – dashboard can poll.');
        }
    }, dbStatus === 'connected');

    // --- Notifications ---
    const [notifications, setNotifications] = useState<AppNotification[]>([]);

    useEffect(() => {
        const fetchAlerts = async () => {
            if (auth.user && auth.user.role === 'user' && auth.user.wishlist.length > 0) {
                const alerts = await generatePersonalizedAlerts(auth.user.wishlist, products.products);
                setNotifications(alerts);
            } else {
                setNotifications([]);
            }
        };
        fetchAlerts();
    }, [auth.user?.wishlist.length, auth.user?.uid, products.products]);

    const markNotificationRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    const clearAllNotifications = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    // --- User Management (Admin Only) ---
    const users = useUsers(auth.user?.role);

    const value = {
        auth,
        products,
        blog,
        content,
        users, // Expose user management
        dbStatus,
        lastError,
        isUsingFallback,
        isDarkMode,
        toggleDarkMode,
        notifications,
        markNotificationRead,
        clearAllNotifications,
        refreshData
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within an AppProvider');
    return context;
};
