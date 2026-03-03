import { useState, useEffect } from 'react';
import { User } from '../../types';
import { dbService } from '../../services/database';

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(() => dbService.getCachedProfile());
    const [isLoading, setIsLoading] = useState(() => !dbService.getCachedProfile());
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);


    // Listen for auth changes from Supabase
    useEffect(() => {
        let isMounted = true;

        // Redundant safety: Ensure loading state is cleared after 5 seconds
        // This handles cases where the auth provider might hang completely
        const safetyTimeout = setTimeout(() => {
            if (isMounted && isLoading) {
                console.warn("[useAuth] Safety timeout triggered - clearing loading state");
                setIsLoading(false);
            }
        }, 5000);

        const unsubscribe = dbService.onAuthStateChanged((userProfile) => {
            if (!isMounted) return;
            clearTimeout(safetyTimeout);
            setUser(userProfile);
            setIsLoading(false);
        });

        return () => {
            isMounted = false;
            clearTimeout(safetyTimeout);
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
