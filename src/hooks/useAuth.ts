import { useState, useEffect } from 'react';
import { User } from '../../types';
import { dbService } from '../../services/database';

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);


    // Listen for auth changes from Supabase
    // Add a timeout to prevent infinite "loading" state if connection hangs
    useEffect(() => {
        let isMounted = true;
        let authTimeout: NodeJS.Timeout;

        const unsubscribe = dbService.onAuthStateChanged((userProfile) => {
            if (!isMounted) return;
            setUser(userProfile);
            setIsLoading(false);
            clearTimeout(authTimeout);
        });

        // Force loading to false after 5 seconds max, even if auth hasn't responded
        authTimeout = setTimeout(() => {
            if (isMounted) {
                console.warn('[useAuth] Auth check timeout - allowing app to load');
                setIsLoading(false);
            }
        }, 5000);

        return () => {
            isMounted = false;
            clearTimeout(authTimeout);
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await dbService.signOut();
        // Note: Caller might need to reset view state after sign out
    };

    const toggleWishlist = async (productId: string) => {
        if (!user) {
            setIsLoginModalOpen(true);
            return;
        }

        const newWishlist = user.wishlist.includes(productId)
            ? user.wishlist.filter(id => id !== productId)
            : [...user.wishlist, productId];

        // Optimistic update
        const updatedUser = { ...user, wishlist: newWishlist };
        setUser(updatedUser);

        try {
            await dbService.updateWishlist(user.uid, newWishlist);
        } catch (e) {
            console.warn("Wishlist sync failed", e);
            // Revert on failure could be implemented here if strict consistency is needed
        }
    };

    return {
        user,
        setUser, // Exposed for cases where we need to manually update user part (like duplicate logic)
        isLoading,
        isLoginModalOpen,
        setIsLoginModalOpen,
        signOut,
        toggleWishlist
    };
};
