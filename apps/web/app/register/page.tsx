"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, User, ArrowRight, Loader2, Phone, Megaphone, Eye, EyeOff, Sparkles } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth, getCookie } from '../../context/AuthContext';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { useGoogleLogin } from '@react-oauth/google';

import { DEFAULT_DIAL_CODES } from '../../lib/phone-codes';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

const registerSchema = z.object({
    fullName: z.string().min(2, 'Enter your full name'),
    email: z.string().email('Please enter a valid email address'),
    phoneCode: z.string(),
    phone: z.string()
        .min(7, 'Phone number must be at least 7 digits')
        .max(15, 'Phone number cannot exceed 15 digits')
        .optional()
        .or(z.literal('')),
    password: z.string()
        .min(8, 'At least 8 characters')
        .regex(/[A-Z]/, 'At least one uppercase letter')
        .regex(/[a-z]/, 'At least one lowercase letter')
        .regex(/[0-9]/, 'At least one number')
        .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/, 'At least one special character (!@#$%^&*)'),
    confirmPassword: z.string(),
    agreedToTerms: z.literal(true, {
        message: 'Agree to terms to continue'
    })
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
}).refine((data) => {
    if (data.phoneCode === 'PK' && data.phone && data.phone.length !== 10) {
        return false;
    }
    return true;
}, {
    message: "Pakistan phone number must be exactly 10 digits",
    path: ["phone"]
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const inputClass =
    'w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white focus:ring-4 focus:ring-blue-500/5 rounded-2xl text-slate-900 font-bold transition-all outline-none';

function GoogleSignupButton({ loading, onError, onSuccess }: { loading: boolean; onError: (message: string) => void; onSuccess: (accessToken: string) => Promise<void> }) {
    const handleGoogleSignup = useGoogleLogin({
        flow: 'implicit',
        scope: 'openid profile email',
        onSuccess: async (tokenResponse) => {
            try {
                await onSuccess(tokenResponse.access_token);
            } catch (err: any) {
                onError(err.message || 'Google registration failed. Please try again.');
            }
        },
        onError: () => {
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            onError(
                'Google sign-up blocked. The domain "' + origin + '" is not registered in Google Cloud Console. ' +
                'Go to console.cloud.google.com → APIs & Services → Credentials → OAuth 2.0 Client IDs → ' +
                'add "' + origin + '" to Authorized JavaScript origins.'
            );
        },
    });

    return (
        <button
            type="button"
            disabled={loading}
            onClick={() => handleGoogleSignup()}
            className="w-full py-4 bg-white border-2 border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl font-black text-sm flex items-center justify-center gap-4 transition-all shadow-sm active:scale-95 disabled:opacity-50 group"
        >
            <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign up with Google
        </button>
    );
}

function RegisterForm() {
    const [referralCode, setReferralCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const { register, googleLogin } = useAuth();
    const searchParams = useSearchParams();
    const redirect = searchParams.get('redirect');

    const {
        register: formRegister,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isValid }
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        mode: 'onChange',
        defaultValues: {
            fullName: '',
            email: '',
            phoneCode: 'PK',
            phone: '',
            password: '',
            confirmPassword: '',
            agreedToTerms: false as any,
        }
    });

    const phoneCode = watch('phoneCode');

    useEffect(() => {
        const ref = searchParams.get('ref');
        if (ref) {
            setReferralCode(ref);
        } else {
            const storedRef = getCookie('referralCode');
            if (storedRef) setReferralCode(storedRef);
        }
    }, [searchParams]);

    const onSubmit = async (data: RegisterFormValues) => {
        setError('');

        const normalizedNumber = (data.phone || '').replace(/^0+/, '');
        let fullPhone = '';
        if (normalizedNumber) {
            const selectedCountry = DEFAULT_DIAL_CODES.find(c => c.code === data.phoneCode);
            const dialCode = selectedCountry ? selectedCountry.dialCode : '+92';
            fullPhone = `${dialCode}${normalizedNumber}`;
            if (!/^\+[1-9]\d{7,14}$/.test(fullPhone)) {
                setError('Please enter a valid phone number (8 to 15 digits).');
                return;
            }
        }

        setLoading(true);
        try {
            await register({
                fullName: data.fullName,
                email: data.email,
                phone: fullPhone || undefined,
                password: data.password,
                role: 'user',
                referralCode: referralCode || undefined,
            });
        } catch (err: any) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Navbar />

            <main className="flex-grow flex items-center justify-center px-4 py-10 relative overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[128px] pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-[128px] pointer-events-none" />

                <div className="max-w-md w-full relative z-10">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">
                            Join Naampata
                        </h1>
                        <p className="text-slate-500 font-medium">
                            One account to browse local businesses or list your own when you are ready.
                        </p>
                    </div>

                    <div className="bg-white rounded-[20px] border border-slate-100 p-8 md:p-10 shadow-2xl shadow-blue-500/5">

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 italic">
                                {error}
                            </div>
                        )}

                        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                    <input
                                        type="text"
                                        className={`${inputClass} ${errors.fullName ? 'border-red-500/50 focus:border-red-500' : ''}`}
                                        placeholder="Enter your full name"
                                        {...formRegister('fullName')}
                                    />
                                </div>
                                {errors.fullName && (
                                    <p className="text-[10px] font-bold text-red-500 ml-1 mt-1">{errors.fullName.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    Phone Number
                                </label>
                                <div className="flex gap-2">
                                    <div className="w-32 relative z-50">
                                        <SearchableSelect
                                            value={phoneCode}
                                            onChange={val => setValue('phoneCode', val as string)}
                                            options={[
                                                ...DEFAULT_DIAL_CODES.map(d => ({ label: `${d.code} (${d.dialCode})`, value: d.code }))
                                            ]}
                                        />
                                    </div>
                                    <div className="relative flex-1">
                                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                        <input
                                            type="tel"
                                            className={`${inputClass} ${errors.phone ? 'border-red-500/50 focus:border-red-500' : ''}`}
                                            placeholder={phoneCode === 'PK' ? '3001234567' : 'Enter phone number'}
                                            maxLength={phoneCode === 'PK' ? 10 : 15}
                                            {...formRegister('phone', {
                                                onChange: (e) => {
                                                    e.target.value = e.target.value.replace(/\D/g, '').slice(0, phoneCode === 'PK' ? 10 : 15);
                                                }
                                            })}
                                        />
                                    </div>
                                </div>
                                {errors.phone && (
                                    <p className="text-[10px] font-bold text-red-500 ml-1 mt-1">{errors.phone.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                    <input
                                        type="email"
                                        className={`${inputClass} ${errors.email ? 'border-red-500/50 focus:border-red-500' : ''}`}
                                        placeholder="name@example.com"
                                        {...formRegister('email')}
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-[10px] font-bold text-red-500 ml-1 mt-1">{errors.email.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className={`${inputClass} pr-14 ${errors.password ? 'border-red-500/50 focus:border-red-500' : ''}`}
                                        placeholder="At least 8 characters"
                                        {...formRegister('password')}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-[10px] font-bold text-red-500 ml-1 mt-1">{errors.password.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    Re-type Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        className={`${inputClass} pr-14 ${errors.confirmPassword ? 'border-red-500/50 focus:border-red-500' : ''}`}
                                        placeholder="Re-type your password"
                                        {...formRegister('confirmPassword')}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {errors.confirmPassword && (
                                    <p className="text-[10px] font-bold text-red-500 ml-1 mt-1">{errors.confirmPassword.message}</p>
                                )}
                            </div>

                            <div className="flex items-start gap-3 px-1 leading-5 pt-1">
                                <div className="relative flex items-center justify-center mt-0.5">
                                    <input
                                        type="checkbox"
                                        id="agreedToTerms"
                                        className="w-5 h-5 appearance-none border-2 border-slate-300 rounded-lg checked:border-blue-500 checked:bg-blue-500 transition-colors cursor-pointer peer"
                                        {...formRegister('agreedToTerms')}
                                    />
                                    <svg className="w-3 h-3 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </div>
                                <label htmlFor="agreedToTerms" className="text-[11px] text-slate-500 font-medium leading-relaxed cursor-pointer">
                                    I agree to the{' '}
                                    <Link href="/terms" className="text-blue-600 font-bold hover:underline">Terms &amp; Conditions</Link>
                                    {' '}and{' '}
                                    <Link href="/privacy" className="text-blue-600 font-bold hover:underline">Privacy Policy</Link>
                                </label>
                            </div>
                            {errors.agreedToTerms && (
                                <p className="text-[10px] font-bold text-red-500 ml-1 mt-1">{errors.agreedToTerms.message}</p>
                            )}

                            <button
                                disabled={loading || !isValid}
                                type="button"
                                onClick={handleSubmit(onSubmit)}
                                className="w-full py-5 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg bg-[#112D4E] hover:bg-black shadow-slate-900/10"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Create Account
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
                            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-slate-300 bg-white px-4">Or continue with</div>
                        </div>

                        {GOOGLE_CLIENT_ID ? (
                            <GoogleSignupButton
                                loading={loading}
                                onError={setError}
                                onSuccess={async (accessToken) => {
                                    setLoading(true);
                                    setError('');
                                    try {
                                        await googleLogin(accessToken, undefined, referralCode);
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                            />
                        ) : (
                            <div className="w-full py-4 bg-slate-50 border-2 border-slate-100 text-slate-400 rounded-2xl font-black text-sm text-center">
                                Google sign-up is not configured yet.
                            </div>
                        )}

                        <p className="mt-6 text-center text-sm text-slate-500 font-bold">
                            Already have an account?{' '}
                            <Link href="/login" className="text-blue-600 hover:text-blue-700 transition-colors">
                                Log in here
                            </Link>
                        </p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            </div>
        }>
            <RegisterForm />
        </Suspense>
    );
}
