"use client";

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, Loader2, KeyRound, CheckCircle, Eye, EyeOff } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { api } from '../../lib/api';

type Step = 'email' | 'reset';

function ForgotPasswordForm() {
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleRequestCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await api.auth.forgotPassword(email.trim());
            setSuccess('If the email exists, a reset code has been sent. Check your inbox.');
            setStep('reset');
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            setLoading(false);
            return;
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long.');
            setLoading(false);
            return;
        }

        try {
            await api.auth.resetPassword(email.trim(), code.trim(), newPassword);
            setSuccess('Password reset successfully! You can now sign in with your new password.');
            setTimeout(() => {
                window.location.href = '/login';
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Invalid or expired code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Navbar />

            <main className="flex-grow flex items-center justify-center px-4 py-20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.05),transparent)]" />
                <div className="absolute bottom-0 left-0 w-1/2 h-full bg-[radial-gradient(circle_at_0%_100%,rgba(99,102,241,0.05),transparent)]" />

                <div className="max-w-md w-full relative z-10">
                    <div className="text-center mb-10">
                        <div className="mx-auto w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                            <KeyRound className="w-8 h-8 text-blue-600" />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">
                            {step === 'email' ? 'Forgot Password' : 'Reset Password'}
                        </h1>
                        <p className="text-slate-500 font-medium">
                            {step === 'email'
                                ? "Enter your email and we'll send you a reset code."
                                : `Enter the code sent to ${email}`
                            }
                        </p>
                    </div>

                    <div className="bg-white rounded-[20px] border border-slate-100 p-8 md:p-10 shadow-2xl shadow-blue-500/5">
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 italic">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="mb-6 p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-sm font-bold border border-emerald-100">
                                {success}
                            </div>
                        )}

                        {step === 'email' ? (
                            <form className="space-y-6" onSubmit={handleRequestCode}>
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

                                <button
                                    disabled={loading}
                                    type="submit"
                                    className="w-full py-5 bg-[#112D4E] hover:bg-black text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all shadow-slate-900/10 active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                        <>
                                            Send Reset Code
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </form>
                        ) : (
                            <form className="space-y-5" onSubmit={handleResetPassword}>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reset Code</label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                        <input
                                            required
                                            type="text"
                                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white focus:ring-4 focus:ring-blue-500/5 rounded-2xl text-slate-900 font-bold transition-all outline-none tracking-widest text-center text-lg"
                                            placeholder="000000"
                                            maxLength={6}
                                            value={code}
                                            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                        <input
                                            required
                                            type={showPassword ? "text" : "password"}
                                            className="w-full pl-14 pr-14 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white focus:ring-4 focus:ring-blue-500/5 rounded-2xl text-slate-900 font-bold transition-all outline-none"
                                            placeholder="••••••••"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                        <input
                                            required
                                            type={showConfirm ? "text" : "password"}
                                            className="w-full pl-14 pr-14 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white focus:ring-4 focus:ring-blue-500/5 rounded-2xl text-slate-900 font-bold transition-all outline-none"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm(!showConfirm)}
                                            className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    {confirmPassword && newPassword !== confirmPassword && (
                                        <p className="text-xs text-red-500 font-bold ml-1">Passwords do not match</p>
                                    )}
                                </div>

                                <button
                                    disabled={loading}
                                    type="submit"
                                    className="w-full py-5 bg-[#112D4E] hover:bg-black text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all shadow-slate-900/10 active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                        <>
                                            Reset Password
                                            <CheckCircle className="w-4 h-4" />
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => { setStep('email'); setError(''); setSuccess(''); setCode(''); }}
                                    className="w-full py-3 text-slate-500 hover:text-slate-700 text-sm font-bold transition-colors"
                                >
                                    Use a different email
                                </button>
                            </form>
                        )}
                    </div>

                    <p className="mt-8 text-center text-sm text-slate-500 font-bold">
                        Remember your password? <Link href="/login" className="text-blue-600 hover:text-blue-700 transition-colors">Sign In</Link>
                    </p>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            </div>
        }>
            <ForgotPasswordForm />
        </Suspense>
    );
}
