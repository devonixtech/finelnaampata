"use client";

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

function GoogleSignInButton({ loading, onError, onSuccess }: { loading: boolean; onError: (message: string) => void; onSuccess: (accessToken: string) => Promise<void> }) {
    const handleGoogleLogin = useGoogleLogin({
        flow: 'implicit',
        scope: 'openid profile email',
        onSuccess: async (tokenResponse) => {
            try {
                await onSuccess(tokenResponse.access_token);
            } catch (err: any) {
                onError(err.message || 'Google sign-in failed. Please try again.');
            }
        },
        onError: (error) => {
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            onError(
                'Google sign-in blocked. The domain "' + origin + '" is not registered in Google Cloud Console. ' +
                'Go to console.cloud.google.com → APIs & Services → Credentials → OAuth 2.0 Client IDs → ' +
                'add "' + origin + '" to Authorized JavaScript origins.'
            );
        },
    });

    return (
        <button
            type="button"
            disabled={loading}
            onClick={() => handleGoogleLogin()}
            className="w-full py-4 bg-white border-2 border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl font-black text-sm flex items-center justify-center gap-4 transition-all shadow-sm active:scale-95 disabled:opacity-50 group"
        >
            <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
            </svg>
            Sign in with Google
        </button>
    );
}

function LoginForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const redirect = searchParams.get('redirect');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { user, login, googleLogin } = useAuth();
    const [showPassword, setShowPassword] = useState(false);

    React.useEffect(() => {
        if (user) {
            router.replace(redirect || '/dashboard');
        }
    }, [user, router, redirect]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login({ email, password });
        } catch (err: any) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Navbar />

            <main className="flex-grow flex items-center justify-center px-4 py-20 relative overflow-hidden">
                {/* Abstract Background */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.05),transparent)]" />
                <div className="absolute bottom-0 left-0 w-1/2 h-full bg-[radial-gradient(circle_at_0%_100%,rgba(99,102,241,0.05),transparent)]" />

                <div className="max-w-md w-full relative z-10">
                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Welcome Back</h1>
                        <p className="text-slate-500 font-medium">Sign in to your naampata account</p>
                    </div>

                    <div className="bg-white rounded-[20px] border border-slate-100 p-8 md:p-10 shadow-2xl shadow-blue-500/5">
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 italic">
                                {error}
                            </div>
                        )}
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                    <input
                                        required
                                        type="email"
                                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white focus:ring-4 focus:ring-blue-500/5 rounded-2xl text-slate-900 font-bold transition-all outline-none"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between ml-1">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Password
                                    </label>
                                    <Link href="/forgot-password" className="text-[10px] font-black text-blue-500 hover:text-blue-600 uppercase tracking-widest">
                                        Forgot Password?
                                    </Link>
                                </div>

                                <div className="relative">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />

                                    <input
                                        required
                                        type={showPassword ? "text" : "password"}
                                        className="w-full pl-14 pr-14 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white focus:ring-4 focus:ring-blue-500/5 rounded-2xl text-slate-900 font-bold transition-all outline-none"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <button
                                disabled={loading}
                                type="submit"
                                className="w-full py-5 bg-[#112D4E] hover:bg-black text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all  shadow-slate-900/10 active:scale-95 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                    <>
                                        Sign In
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="relative my-10">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-slate-300 bg-white px-4">Or continue with</div>
                        </div>

                        {GOOGLE_CLIENT_ID ? (
                            <GoogleSignInButton
                                loading={loading}
                                onError={setError}
                                onSuccess={async (accessToken) => {
                                    setLoading(true);
                                    setError('');
                                    try {
                                        await googleLogin(accessToken);
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                            />
                        ) : (
                            <div className="w-full py-4 bg-slate-50 border-2 border-slate-100 text-slate-400 rounded-2xl font-black text-sm text-center">
                                Google sign-in is not configured yet.
                            </div>
                        )}
                    </div>

                    <p className="mt-8 text-center text-sm text-slate-500 font-bold">
                        Don't have an account? <Link href={redirect ? `/register?redirect=${encodeURIComponent(redirect)}` : '/register'} className="text-blue-600 hover:text-blue-700 transition-colors">Create one for free</Link>
                    </p>
                </div>
            </main>

            <Footer />
        </div>
    );
}


export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
