import { useState, useEffect } from 'react';
import { User } from '../../types';
import { dbService } from '../../services/database';

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);


    // Listen for auth changes from Supabase
    useEffect(() => {
        let isMounted = true;
        const unsubscribe = dbService.onAuthStateChanged((userProfile) => {
            if (!isMounted) return;
            setUser(userProfile);
            setIsLoading(false);
        });
        return () => {
            isMounted = false;
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, []);

    const signOut = async () => {
        // Clear cached data so the next user on this device starts fresh
        const keysToRemove = Object.keys(localStorage).filter(k =>
            k.startsWith('cache_') || k === 'wishlist' || k === 'user_preferences'
        );
        keysToRemove.forEach(k => localStorage.removeItem(k));
        await dbService.signOut();
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
        const previousWishlist = user.wishlist;
        setUser({ ...user, wishlist: newWishlist });

        try {
            await dbService.updateWishlist(user.uid, newWishlist);
        } catch (e) {
            console.warn("Wishlist sync failed, reverting", e);
            setUser({ ...user, wishlist: previousWishlist });
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
