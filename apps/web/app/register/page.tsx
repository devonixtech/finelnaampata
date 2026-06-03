"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, User, ArrowRight, Loader2, Phone, Megaphone, Eye, EyeOff, Sparkles } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth, getCookie } from '../../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';

import { DEFAULT_DIAL_CODES } from '../../lib/phone-codes';

const inputClass =
    'w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white focus:ring-4 focus:ring-blue-500/5 rounded-2xl text-slate-900 font-bold transition-all outline-none';

function RegisterForm() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [phoneCode, setPhoneCode] = useState('+92');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const { register, googleLogin } = useAuth();
    const searchParams = useSearchParams();

    // Real-time validation
    const passwordValidation = {
        minLength: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password),
    };
    const isPasswordValid = Object.values(passwordValidation).every(Boolean);
    const isEmailValid = email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isPhoneValid = phone.length === 0 || (phone.length >= 7 && phone.length <= 15);
    const fullNameValid = fullName.trim().length >= 2;
    const confirmPasswordValid = confirmPassword.length > 0 && password === confirmPassword;
    const isFormValid = isPasswordValid && isEmailValid && isPhoneValid && fullNameValid && confirmPasswordValid && agreedToTerms;

    useEffect(() => {
        const ref = searchParams.get('ref');
        if (ref) {
            setReferralCode(ref);
        } else {
            const storedRef = getCookie('referralCode');
            if (storedRef) setReferralCode(storedRef);
        }
    }, [searchParams]);

    const handleGoogleSignup = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setLoading(true);
            setError('');
            try {
                await googleLogin(tokenResponse.access_token, undefined, referralCode);
            } catch (err: any) {
                setError(err.message || 'Google registration failed. Please try again.');
            } finally {
                setLoading(false);
            }
        },
        onError: () => setError('Google registration failed. Please try again.'),
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!agreedToTerms) {
            setError('Please agree to the Terms and Privacy Policy to continue.');
            return;
        }

        const hasMinLength = password.length >= 8;
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password);
        if (!hasMinLength || !hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
            setError('Password must meet all strength requirements (8+ chars, upper, lower, number, special character).');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        const normalizedNumber = phone.replace(/^0+/, ''); // Strip leading zero
        const fullPhone = `${phoneCode}${normalizedNumber}`;
        if (phone && !/^\+[1-9]\d{7,14}$/.test(fullPhone)) {
            setError('Please enter a valid phone number (8 to 15 digits).');
            return;
        }

        setLoading(true);
        try {
            await register({
                fullName,
                email,
                phone: fullPhone,
                password,
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

                        {referralCode && (
                            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Referred By Affiliate</p>
                                    <p className="text-sm font-bold text-emerald-900 mt-0.5">Code: {referralCode}</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-emerald-600" />
                                </div>
                            </div>
                        )}

                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                    <input
                                        required
                                        type="text"
                                        className={inputClass}
                                        placeholder="Enter your full name"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    Phone Number
                                </label>
                                <div className="flex gap-2">
                                    <select
                                        className="w-32 px-3 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl text-slate-900 font-bold transition-all outline-none"
                                        value={phoneCode}
                                        onChange={(e) => setPhoneCode(e.target.value)}
                                    >
                                        {DEFAULT_DIAL_CODES.map((d) => (
                                            <option key={d.code} value={d.dialCode}>
                                                {d.code} ({d.dialCode})
                                            </option>
                                        ))}
                                    </select>
                                    <div className="relative flex-1">
                                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                        <input
                                            required
                                            type="tel"
                                            className={inputClass}
                                            placeholder="3001234567"
                                            value={phone}
                                            maxLength={15}
                                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 15))}
                                        />
                                    </div>
                                </div>
                                {phone.length > 0 && phone.length < 7 && (
                                    <p className="text-[10px] font-bold text-red-500 ml-1 mt-1">Phone number must be at least 7 digits</p>
                                )}
                                {phone.length > 15 && (
                                    <p className="text-[10px] font-bold text-red-500 ml-1 mt-1">Phone number cannot exceed 15 digits</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                    <input
                                        required
                                        type="email"
                                        className={inputClass}
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                {email.length > 0 && !isEmailValid && (
                                    <p className="text-[10px] font-bold text-red-500 ml-1 mt-1">Please enter a valid email address</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                    <input
                                        required
                                        type={showPassword ? 'text' : 'password'}
                                        className={`${inputClass} pr-14`}
                                        placeholder="At least 8 characters"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                <div className="mt-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs font-medium text-slate-500">
                                    <p className="font-bold text-[10px] uppercase tracking-wider text-slate-400 mb-1">Password Strength</p>
                                    {[
                                        { label: 'At least 8 characters', check: passwordValidation.minLength },
                                        { label: 'At least one uppercase letter', check: passwordValidation.uppercase },
                                        { label: 'At least one lowercase letter', check: passwordValidation.lowercase },
                                        { label: 'At least one number', check: passwordValidation.number },
                                        { label: 'At least one special character (!@#$%^&*)', check: passwordValidation.special },
                                    ].map(({ label, check }) => (
                                        <div key={label} className="flex items-center gap-2">
                                            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${check ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                            <span className={check ? 'text-slate-900 font-semibold' : 'text-slate-400'}>{label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    Re-type Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                    <input
                                        required
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        className={`${inputClass} pr-14`}
                                        placeholder="Re-type your password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {confirmPassword && password !== confirmPassword && (
                                    <p className="text-[10px] font-bold text-red-500 ml-1 mt-1">Passwords do not match</p>
                                )}
                                {confirmPassword && password === confirmPassword && (
                                    <p className="text-[10px] font-bold text-emerald-500 ml-1 mt-1">✓ Passwords match</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    Referral Code (Optional)
                                </label>
                                <div className="relative">
                                    <Megaphone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                    <input
                                        type="text"
                                        className="w-full pl-14 pr-6 py-4 bg-blue-50/30 border-2 border-transparent focus:border-blue-500/20 focus:bg-white focus:ring-4 focus:ring-blue-500/5 rounded-2xl text-slate-900 font-bold transition-all outline-none uppercase placeholder:normal-case"
                                        placeholder="Enter referral code (if you have one)"
                                        value={referralCode}
                                        onChange={(e) => setReferralCode(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex items-start gap-3 px-1 leading-5 pt-1">
                                <div className="relative flex items-center justify-center mt-0.5">
                                    <input
                                        type="checkbox"
                                        id="agreeToTerms"
                                        checked={agreedToTerms}
                                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                                        className="w-5 h-5 appearance-none border-2 border-slate-300 rounded-lg checked:border-blue-500 checked:bg-blue-500 transition-colors cursor-pointer peer"
                                    />
                                    <svg className="w-3 h-3 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </div>
                                <label htmlFor="agreeToTerms" className="text-[11px] text-slate-500 font-medium leading-relaxed cursor-pointer">
                                    I agree to the{' '}
                                    <Link href="/terms" className="text-blue-600 font-bold hover:underline">Terms &amp; Conditions</Link>
                                    {' '}and{' '}
                                    <Link href="/privacy" className="text-blue-600 font-bold hover:underline">Privacy Policy</Link>
                                </label>
                            </div>

                            <button
                                disabled={loading || !isFormValid}
                                type="submit"
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
                            {!isFormValid && !loading && (
                                <p className="text-[10px] font-bold text-slate-400 text-center mt-2">
                                    {!fullNameValid && 'Enter your full name'}
                                    {fullNameValid && !isEmailValid && 'Enter a valid email'}
                                    {fullNameValid && isEmailValid && !isPasswordValid && 'Password does not meet requirements'}
                                    {fullNameValid && isEmailValid && isPasswordValid && !confirmPasswordValid && 'Passwords must match'}
                                    {fullNameValid && isEmailValid && isPasswordValid && confirmPasswordValid && !agreedToTerms && 'Agree to terms to continue'}
                                </p>
                            )}
                        </form>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
                            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-slate-300 bg-white px-4">Or continue with</div>
                        </div>

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
