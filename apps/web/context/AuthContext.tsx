"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api';
import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

// Ping interval: mark user as online every 90 seconds
const PING_INTERVAL_MS = 90_000;

export function setCookie(name: string, value: string, days: number) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

export function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

export function deleteCookie(name: string) {
    if (typeof document !== 'undefined') {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax`;
    }
}

interface AuthContextType {
    user: any | null;
    loading: boolean;
    login: (credentials: any) => Promise<void>;
    googleLogin: (credential: string, role?: string, referralCode?: string) => Promise<void>;
    register: (userData: any) => Promise<void>;
    logout: () => void;
    updateUser: (userData: any) => void;
    syncProfile: () => Promise<void>;
    verifyEmail: (otp: string) => Promise<void>;
    resendOtp: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Captures URL referral code globally and sets it in a 10-day cookie
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const ref = params.get('ref');
            if (ref) {
                setCookie('referralCode', ref, 10);
                console.log('[AuthContext] Stored referral code in 10-day cookie:', ref);
            }
        }
    }, []);

    // --- Heartbeat: mark user as online in DB ---
    const startPing = () => {
        // Fire immediately
        api.auth.ping().catch(() => {});

        // Then fire every PING_INTERVAL_MS
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
            api.auth.ping().catch(() => {});
        }, PING_INTERVAL_MS);
    };

    const stopPing = () => {
        if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
        }
    };

    useEffect(() => {
        const initAuth = async () => {
            try {
                const storedUser = localStorage.getItem('user');
                const token = localStorage.getItem('token');

                if (storedUser && token) {
                    try {
                        const parsedUser = JSON.parse(storedUser);
                        setUser(parsedUser);

                        // Sync profile with backend to get latest data (including vendor relation)
                        await syncProfile();

                        // Start heartbeat: mark user as online
                        startPing();
                    } catch (e) {
                        console.error('Failed to parse stored user:', e);
                        localStorage.removeItem('user');
                        localStorage.removeItem('token');
                    }
                }
            } catch (err) {
                console.error('Auth initialization error:', err);
            } finally {
                setLoading(false);
            }
        };

        initAuth();

        // Cross-tab syncing
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'user' && e.newValue) {
                try {
                    setUser(JSON.parse(e.newValue));
                } catch (e) {
                    console.error('Cross-tab sync error:', e);
                }
            } else if (e.key === 'token' && !e.newValue) {
                setUser(null);
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            stopPing();
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const logout = async () => {
        stopPing();
        try {
            await api.auth.logout();
        } catch (err) {
            console.warn('[AuthContext] Backend logout failed:', err);
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        router.push('/login');
    };

    const syncProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await api.users.getProfile();
            if (response) {
                setUser(response);
                localStorage.setItem('user', JSON.stringify(response));
                console.log('[AuthContext] Profile synced successfully');
            }
        } catch (err: any) {
            console.error('[AuthContext] Profile sync failed:', err);
            // If the token is invalid or expired, clear the local state
            if (err.message?.toLowerCase().includes('token') || err.message?.toLowerCase().includes('unauthorized')) {
                logout();
            }
        }
    };

    const redirectUser = (user: any, isSignup: boolean = false) => {
        if (user.role === 'admin' || user.role === 'superadmin') {
            router.push('/admin');
            return;
        }
        if (isSignup && !user.isEmailVerified && user.provider !== 'google') {
            router.push('/verify-email');
            return;
        }
        router.push('/dashboard');
    };

    const login = async (credentials: any) => {
        const response = await api.auth.login(credentials);
        localStorage.setItem('token', response.tokens.accessToken);
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
        // Immediately mark online in DB
        api.auth.ping().catch(() => {});
        startPing();
        // Sync profile to ensure full data (relations like subscriptions)
        await syncProfile();
        redirectUser(response.user, false);
    };

    const googleLogin = async (credential: string, role?: string, referralCode?: string) => {
        const response = await api.auth.googleLogin({ credential, role, referralCode });
        localStorage.setItem('token', response.tokens.accessToken);
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
        // Immediately mark online in DB
        api.auth.ping().catch(() => {});
        startPing();
        // Sync profile to ensure full data (relations like subscriptions)
        await syncProfile();
        
        redirectUser(response.user, true);
    };

    const register = async (userData: any) => {
        const response = await api.auth.register(userData);
        localStorage.setItem('token', response.tokens.accessToken);
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
        startPing();
        // Sync profile to ensure full data (relations like subscriptions)
        await syncProfile();
        redirectUser(response.user, true);
    };

    const updateUser = (userData: any) => {
        const updatedUser = { ...user, ...userData };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const verifyEmail = async (otp: string) => {
        if (!user?.email) throw new Error('No user email found.');
        await api.auth.verifyEmail(user.email, otp);
        // Mark user as verified in local state
        const updated = { ...user, isEmailVerified: true };
        setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
        router.push('/dashboard');
    };

    const resendOtp = async () => {
        if (!user?.email) throw new Error('No user email found.');
        await api.auth.resendOtp(user.email);
    };

    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <AuthContext.Provider value={{ user, loading, login, googleLogin, register, logout, updateUser, syncProfile, verifyEmail, resendOtp }}>
                {children}
            </AuthContext.Provider>
        </GoogleOAuthProvider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
