import React, { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { useProducts } from '../hooks/useProducts';
import { useBlogPosts } from '../hooks/useBlogPosts';
import { useSiteContent } from '../hooks/useSiteContent';
import { useUsers } from '../hooks/useUsers';
import { dbService } from '../../services/database';
import { connectionManager, ConnectionStatus } from '../../services/connectionManager';
import { AppNotification, Product, BlogPost, SiteContent } from '../../types';
import { generatePersonalizedAlerts } from '../../services/geminiService';

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

    // --- Hooks ---
    const auth = useAuth();
    const content = useSiteContent(auth.user?.role);

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
        const heartbeat = setInterval(async () => {
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
                const isHealthy = await dbService.testConnection();
                if (isHealthy) {
                    console.log('[Heartbeat] Connection restored!');
                    toast.success('Database connection restored');
                    connectionManager.markConnected();
                }
            }
        }, 120000); // Check every 2 minutes instead of 1 minute
        return () => clearInterval(heartbeat);
    }, []);

    // We initialize hooks with empty data, then populate via loadData
    const products = useProducts(dbStatus, auth.user?.role, content.siteContent.categories);
    const blog = useBlogPosts();

    // --- Data Loading ---
    // Initialize with empty state (service layer now handles caching internally)
    useEffect(() => {
        products.setProducts([]);
        blog.setBlogPosts([]);
        // We don't set liveSiteContent to INITIAL_SITE_CONTENT anymore
    }, []); // Run once on mount

    // Background data hydration (non-blocking)
    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>;
        const loadData = async () => {
            // 60s timeout to handle Supabase cold starts (Free Tier pauses)
            const timeout = 60000;
            const attemptTimeoutPromise = new Promise<never>((_, reject) => {
                timeoutId = setTimeout(() => {
                    reject(new Error(`Connection timed out after ${timeout / 1000}s. Your database may be waking up from sleep mode.`));
                }, timeout);
            });

            try {
                // Don't mark as 'loading' if we already have fallback data,
                // but we use connectionManager to track it.
                connectionManager.markLoading();

                const [isConnected, dbProducts, dbPosts, dbContent] = await Promise.race([
                    Promise.all([
                        dbService.testConnection(),
                        dbService.getProducts(),
                        dbService.getBlogPosts(),
                        dbService.getSiteContent()
                    ]),
                    attemptTimeoutPromise
                ]) as [boolean, Product[] | null, BlogPost[] | null, SiteContent | null];

                clearTimeout(timeoutId);

                if (!isConnected) {
                    throw new Error("Failed to connect to the database. Server might be down or credentials invalid.");
                }

                if (dbProducts === null || dbPosts === null) {
                    throw new Error("Missing response from database (connection might be throttled or blocked).");
                }

                connectionManager.markConnected();

                if (dbProducts) products.setProducts(dbProducts);
                if (dbPosts) blog.setBlogPosts(dbPosts);
                if (dbContent) content.setLiveSiteContent(dbContent);

            } catch (e: any) {
                clearTimeout(timeoutId);
                console.warn(`[Background Sync] Failed:`, e.message);
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
            const [isConnected, dbProducts, dbPosts, dbContent] = await Promise.all([
                dbService.testConnection(),
                dbService.getProducts(),
                dbService.getBlogPosts(),
                dbService.getSiteContent()
            ]);

            if (!isConnected) {
                throw new Error("Cloud database is unreachable.");
            }

            if (dbProducts === null || dbPosts === null) {
                throw new Error("Database responded but failed to return core data.");
            }

            products.setProducts(dbProducts);
            blog.setBlogPosts(dbPosts);
            if (dbContent) content.setLiveSiteContent(dbContent);

            connectionManager.markConnected();
            toast.success("Successfully synced with Cloud Database!");
        } catch (e: any) {
            console.error("Manual refresh failed:", e);
            connectionManager.markFailed(e);
            toast.error(e.message || "Cloud Refresh Failed. Using local fallback.");
        }
    };

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
