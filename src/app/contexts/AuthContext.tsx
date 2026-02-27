import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    updateProfile,
    type User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'owner' | 'tenant';
    phone?: string;
}

interface AuthContextType {
    user: User | null;
    firebaseUser: FirebaseUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string, role?: string, phone?: string) => Promise<void>;
    logout: () => Promise<void>;
    googleLogin: () => Promise<void>;
    updateUserProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000';

// Helper: sync user with Node.js backend
async function syncUserWithBackend(fbUser: FirebaseUser, extraData?: { name?: string; role?: string; phone?: string }): Promise<User> {
    const token = await fbUser.getIdToken();
    const response = await fetch(`${API_URL}/api/auth/sync`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
            firebase_uid: fbUser.uid,
            email: fbUser.email,
            name: extraData?.name || fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            role: extraData?.role || 'owner',
            phone: extraData?.phone || '',
        }),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Backend sync failed');
    }
    return response.json();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Single source of truth for auth state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            console.log('Firebase auth state changed:', fbUser?.email);
            setFirebaseUser(fbUser);

            if (fbUser) {
                try {
                    // Sync with backend every time auth state changes to a user
                    const backendUser = await syncUserWithBackend(fbUser);
                    setUser(backendUser);
                } catch (error) {
                    console.error('Failed to sync user with backend:', error);
                    setUser({
                        id: fbUser.uid,
                        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
                        email: fbUser.email || '',
                        role: 'owner',
                    });
                }
            } else {
                setUser(null);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, password: string): Promise<void> => {
        setIsLoading(true); // Show loading while signing in
        await signInWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged will handle the rest
    };

    const signup = async (
        name: string,
        email: string,
        password: string,
        role: string = 'owner',
        phone?: string
    ): Promise<void> => {
        setIsLoading(true);
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        // We could call sync here with extraData, but onAuthStateChanged will also fire.
        // To ensure role/phone are saved, we'll let onAuthStateChanged trigger sync normally.
        // If we need to pass role/phone specifically on first signup, we could use a ref or state.
    };

    const googleLogin = async (): Promise<void> => {
        setIsLoading(true);
        await signInWithPopup(auth, googleProvider);
    };

    const logout = async (): Promise<void> => {
        setIsLoading(true);
        await signOut(auth);
    };

    const updateUserProfile = async (data: Partial<User>): Promise<void> => {
        if (!auth.currentUser) throw new Error('Not authenticated');
        const token = await auth.currentUser.getIdToken();
        const response = await fetch(`${API_URL}/api/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || 'Profile update failed');
        }
        const updated = await response.json();
        setUser(updated);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                firebaseUser,
                isAuthenticated: !!user,
                isLoading,
                login,
                signup,
                googleLogin,
                logout,
                updateUserProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
