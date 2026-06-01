"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Mail, ArrowLeft, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
    const { user, verifyEmail, resendOtp, logout, loading } = useAuth();
    const router = useRouter();
    const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [timer, setTimer] = useState<number>(60);
    const [canResend, setCanResend] = useState<boolean>(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        // Redirect if user is not logged in or already verified
        if (!loading) {
            if (!user) {
                router.replace('/login');
            } else if (user.isEmailVerified || user.provider === 'google') {
                router.replace('/dashboard');
            }
        }
    }, [user, loading, router]);

    // Timer logic for resending code
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (timer > 0 && !canResend) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [timer, canResend]);

    // Focus first input box on load
    useEffect(() => {
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []);

    const handleChange = (element: HTMLInputElement, index: number) => {
        const value = element.value;
        if (isNaN(Number(value))) return;

        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1); // Take last digit
        setOtp(newOtp);

        // Move focus to next input if filled
        if (value && index < 5 && inputRefs.current[index + 1]) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace') {
            const newOtp = [...otp];
            if (!otp[index] && index > 0) {
                // Focus previous input on backspace if current is empty
                newOtp[index - 1] = "";
                setOtp(newOtp);
                inputRefs.current[index - 1]?.focus();
            } else {
                newOtp[index] = "";
                setOtp(newOtp);
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").trim();
        if (pastedData.length !== 6 || isNaN(Number(pastedData))) return;

        const pastedArray = pastedData.split("");
        setOtp(pastedArray);
        inputRefs.current[5]?.focus();
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);

        const code = otp.join("");
        if (code.length !== 6) {
            setError("Please enter all 6 digits of the verification code.");
            return;
        }

        setIsSubmitting(true);
        try {
            await verifyEmail(code);
            setSuccessMsg("Email verified successfully! Redirecting...");
        } catch (err: any) {
            setError(err.message || "Invalid or expired verification code.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResend = async () => {
        if (!canResend) return;
        setError(null);
        setSuccessMsg(null);
        setIsResending(true);

        try {
            await resendOtp();
            setSuccessMsg("A new verification code has been sent to your email.");
            setTimer(60);
            setCanResend(false);
            setOtp(new Array(6).fill(""));
            if (inputRefs.current[0]) {
                inputRefs.current[0].focus();
            }
        } catch (err: any) {
            setError(err.message || "Failed to resend verification code. Please try again.");
        } finally {
            setIsResending(false);
        }
    };

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-[#112D4E] animate-spin" />
                    <span className="text-sm font-semibold text-[#112D4E]/60 uppercase tracking-widest animate-pulse">Loading Account details...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC] relative overflow-hidden px-4">
            {/* Background design accents */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-50/50 rounded-full blur-[140px] -mr-80 -mt-80 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-50/40 rounded-full blur-[140px] -ml-80 -mb-80 pointer-events-none" />

            <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Premium Glassmorphic Card */}
                <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl shadow-slate-200/50 border border-white p-8 md:p-10 flex flex-col items-center">
                    
                    {/* Header Icon */}
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100 mb-6 shadow-sm">
                        <Mail className="w-8 h-8 text-[#112D4E]" />
                    </div>

                    <h1 className="text-2xl font-extrabold text-[#112D4E] tracking-tight mb-2">Verify Your Email</h1>
                    <p className="text-center text-sm text-slate-500 leading-relaxed mb-8">
                        We sent a 6-digit verification code to <span className="font-semibold text-slate-700">{user.email}</span>. Please enter the code below to secure and verify your account.
                    </p>

                    {/* Alerts */}
                    {error && (
                        <div className="w-full bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start gap-3 mb-6 animate-shake">
                            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                            <span className="text-xs font-semibold text-rose-700 leading-relaxed">{error}</span>
                        </div>
                    )}

                    {successMsg && (
                        <div className="w-full bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3 mb-6 animate-pulse">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="text-xs font-semibold text-emerald-700 leading-relaxed">{successMsg}</span>
                        </div>
                    )}

                    {/* Verification Form */}
                    <form onSubmit={handleVerify} className="w-full flex flex-col gap-6">
                        <div className="flex justify-between items-center gap-2">
                            {otp.map((data, index) => (
                                <input
                                    key={index}
                                    type="text"
                                    maxLength={1}
                                    ref={(el) => {
                                        inputRefs.current[index] = el;
                                    }}
                                    value={data}
                                    onChange={(e) => handleChange(e.target, index)}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    onPaste={handlePaste}
                                    className="w-12 h-14 text-center text-xl font-extrabold text-[#112D4E] bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-sm duration-150"
                                />
                            ))}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#112D4E] to-blue-900 text-white font-semibold text-sm hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-slate-300"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <ShieldCheck className="w-4 h-4" />
                            )}
                            Verify Account
                        </button>
                    </form>

                    {/* Resend Action */}
                    <div className="w-full flex flex-col items-center gap-4 mt-8 pt-6 border-t border-slate-100">
                        <div className="text-xs text-slate-400 font-medium">
                            Didn&apos;t receive the code?
                        </div>
                        {canResend ? (
                            <button
                                onClick={handleResend}
                                disabled={isResending}
                                className="flex items-center gap-2 text-xs font-bold text-[#FF7A30] hover:text-orange-600 transition-colors disabled:opacity-50"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                                Resend Verification Code
                            </button>
                        ) : (
                            <span className="text-xs font-bold text-slate-400">
                                Resend code in <span className="text-slate-600">{timer}s</span>
                            </span>
                        )}
                    </div>

                    {/* Back to Login */}
                    <button
                        onClick={() => logout()}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors mt-6"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Log out / Switch account
                    </button>
                </div>
            </div>
        </div>
    );
}
