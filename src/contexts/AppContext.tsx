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
import { generatePersonalizedAlerts } from '../../services/geminiService.proxy';
import { CacheService } from '../modules/cache';

interface AppContextType {
    auth: ReturnType<typeof useAuth>;
    products: ReturnType<typeof useProducts>;
    blog: ReturnType<typeof useBlogPosts>;
    content: ReturnType<typeof useSiteContent>;
    users: ReturnType<typeof useUsers>;

    dbStatus: ConnectionStatus;
    lastError: string | null;
    isUsingFallback: boolean;

    isDarkMode: boolean;
    toggleDarkMode: () => void;

    notifications: AppNotification[];
    markNotificationRead: (id: string) => void;
    clearAllNotifications: () => void;

    refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

    const [initialCachedProducts] = useState(() => CacheService.loadProducts() || []);
    const [initialCachedBlogs] = useState(() => CacheService.loadBlogs() || []);
    const [initialCachedContent] = useState(() => CacheService.loadContent() || null);

    const auth = useAuth();
    const content = useSiteContent(auth.user?.role, initialCachedContent);

    const [dbStatus, setDbStatus] = useState<ConnectionStatus>(connectionManager.getState().status);
    const [lastError, setLastError] = useState<string | null>(connectionManager.getState().lastError);
    const [isUsingFallback, setIsUsingFallback] = useState(false);

    useEffect(() => {
        const unsubscribe = connectionManager.subscribe((state) => {
            setDbStatus(state.status);
            setLastError(state.lastError);
            if (state.status === 'offline') setIsUsingFallback(true);
            if (state.status === 'connected') setIsUsingFallback(false);
        });
        return unsubscribe;
    }, []);

    const products = useProducts(dbStatus, auth.user?.role, content.siteContent.categories, initialCachedProducts);
    const blog = useBlogPosts(initialCachedBlogs);

    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>;
        const loadData = async () => {
            const timeout = 60000;
            const attemptTimeoutPromise = new Promise<never>((_, reject) => {
                timeoutId = setTimeout(() => {
                    reject(new Error(`Database wakeup timeout (${timeout / 1000}s).`));
                }, timeout);
            });

            try {
                connectionManager.markLoading();

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
                    throw new Error("Failed to connect to the database.");
                }

                connectionManager.markConnected();

                if (dbProducts) {
                    products.setProducts(dbProducts);
                    CacheService.saveProducts(dbProducts);
                }
                if (dbPosts) {
                    blog.setBlogPosts(dbPosts);
                    CacheService.saveBlogs(dbPosts);
                }
                if (dbContent) {
                    content.setLiveSiteContent(dbContent);
                    CacheService.saveContent(dbContent);
                }

            } catch (e: any) {
                clearTimeout(timeoutId);
                console.warn(`[Background Hydration] Initial attempt failed:`, e.message);
                connectionManager.markFailed(e);
            }
        };

        loadData();

        return () => {
            clearTimeout(timeoutId);
        };
    }, [auth.user?.role]);

    const refreshData = async () => {
        try {
            connectionManager.markLoading();
            const [dbProducts, dbPosts, dbContent] = await Promise.all([
                dbService.getProducts(),
                dbService.getBlogPosts(),
                dbService.getSiteContent()
            ]);

            if (dbProducts === null || dbPosts === null) {
                throw new Error("Cloud database is unreachable.");
            }

            if (dbProducts) {
                products.setProducts(dbProducts);
                CacheService.saveProducts(dbProducts);
            }
            if (dbPosts) {
                blog.setBlogPosts(dbPosts);
                CacheService.saveBlogs(dbPosts);
            }
            if (dbContent) {
                content.setLiveSiteContent(dbContent);
                CacheService.saveContent(dbContent);
            }

            connectionManager.markConnected();
            if (auth.user?.role === 'admin') {
                toast.success("Successfully synced with Cloud Database!");
            }
        } catch (e: any) {
            console.error("Manual refresh failed:", e);
            connectionManager.markFailed(e);
            if (auth.user?.role === 'admin') {
                toast.error(e.message || "Cloud Refresh Failed.");
            }
        }
    };

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

    const users = useUsers(auth.user?.role);

    const value = {
        auth,
        products,
        blog,
        content,
        users,
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
