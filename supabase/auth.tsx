import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authStateChanged, signOut as sbSignOut } from './service';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithGitHub: () => Promise<void>;
    signInWithMagicLink: (email: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = authStateChanged((u) => {
            setUser(u);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const signOut = async () => {
        setIsLoading(true);
        await sbSignOut();
        setUser(null);
        setIsLoading(false);
    };

    const signInWithProvider = async (provider: 'google' | 'github') => {
        try {
            await signInWithProvider(provider);
        } catch (e) {
            console.error(`Failed to sign in with ${provider}`, e);
        }
    };

    const sendMagicLink = async (email: string) => {
        try {
            await sendMagicLink(email);
        } catch (e) {
            console.error("Failed to send magic link", e);
            throw e;
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            signInWithGoogle: () => signInWithProvider('google'),
            signInWithGitHub: () => signInWithProvider('github'),
            signInWithMagicLink: sendMagicLink,
            signOut
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuthContext must be used within an AuthProvider");
    return context;
};
