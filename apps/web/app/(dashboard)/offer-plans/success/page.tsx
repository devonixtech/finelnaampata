"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, ArrowRight, Gift, Tag, Calendar, Loader2, Sparkles, Rocket, ArrowUpRight, Check } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { api } from '../../../../lib/api';

function SuccessContent() {
    const params = useSearchParams();
    const router = useRouter();
    const planName = params.get('plan') || 'Feature Boost';
    const duration = params.get('duration') || '1';
    const unit = params.get('unit') || 'day';
    const sessionId = params.get('session_id');

    const [step, setStep] = useState<'verifying' | 'celebrating' | 'success'>('verifying');
    const [error, setError] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(10);

    // 1. Verification Logic
    useEffect(() => {
        if (!sessionId) {
            setStep('success');
            return;
        }

        const verifyPayment = async () => {
            try {
                // The offer-plans use the subscriptions/verify endpoint with metadata.planId
                const response: any = await api.subscriptions.verify(sessionId);
                if (response.success || response.alreadyProcessed) {
                    // Start celebration!
                    setStep('celebrating');
                    
                    // Trigger confetti
                    const duration = 3 * 1000;
                    const animationEnd = Date.now() + duration;
                    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

                    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

                    const interval: any = setInterval(function() {
                        const timeLeft = animationEnd - Date.now();

                        if (timeLeft <= 0) {
                            return clearInterval(interval);
                        }

                        const particleCount = 50 * (timeLeft / duration);
                        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
                    }, 250);

                    // Move to success details after celebration
                    setTimeout(() => setStep('success'), 4000);
                } else {
                    setError('Payment verification failed. Please contact support.');
                    setStep('success');
                }
            } catch (err) {
                console.error('Error verifying payment:', err);
                setError('Could not verify payment automatically. Our system will sync shortly.');
                setStep('success');
            }
        };

        verifyPayment();
    }, [sessionId]);

    // 2. Countdown logic for auto-redirect
    useEffect(() => {
        if (step !== 'success') return;
        
        const t = setInterval(() => {
            setCountdown(c => (c > 0 ? c - 1 : 0));
        }, 1000);
        return () => clearInterval(t);
    }, [step]);

    useEffect(() => {
        if (step === 'success' && countdown <= 0) {
            router.push('/deals');
        }
    }, [countdown, step, router]);

    return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-100/50 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-100/50 rounded-full blur-[120px] animate-pulse" />
            </div>

            <AnimatePresence mode="wait">
                {/* STEP 1: VERIFYING */}
                {step === 'verifying' && (
                    <motion.div
                        key="verifying"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="relative z-10 w-full max-w-md text-center"
                    >
                        <div className="bg-white/70 backdrop-blur-xl border border-white rounded-[2.5rem] p-10 shadow-2xl shadow-orange-500/5">
                            <div className="relative w-24 h-24 mx-auto mb-8">
                                <motion.div 
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 border-4 border-orange-100 rounded-full border-t-orange-500"
                                />
                                <div className="absolute inset-4 bg-orange-50 rounded-full flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-orange-500 animate-pulse" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 mb-3 uppercase tracking-tight">Confirming Boost</h2>
                            <p className="text-slate-500 font-bold leading-relaxed">
                                Please wait while we sync your listing visibility with our servers...
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* STEP 2: CELEBRATING */}
                {step === 'celebrating' && (
                    <motion.div
                        key="celebrating"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, y: -100 }}
                        className="relative z-10 w-full max-w-lg text-center"
                    >
                        <motion.div
                            initial={{ y: 20 }}
                            animate={{ y: 0 }}
                            className="bg-white rounded-[3rem] p-12 shadow-2xl shadow-orange-500/20 border border-orange-100"
                        >
                            <div className="relative mb-10">
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-orange-400 rounded-full blur-3xl"
                                />
                                <motion.div
                                    initial={{ scale: 0, rotate: -45 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", damping: 10 }}
                                    className="relative w-32 h-32 bg-gradient-to-tr from-orange-500 to-amber-400 rounded-full mx-auto flex items-center justify-center shadow-2xl"
                                >
                                    <Rocket className="w-16 h-16 text-white" />
                                </motion.div>
                            </div>

                            <motion.h1
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-4xl sm:text-5xl font-black text-slate-900 mb-4 tracking-tighter"
                            >
                                MISSION <span className="text-orange-500">COMPLETE!</span>
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-xl font-bold text-slate-400"
                            >
                                Your local presence is reaching new heights!
                            </motion.p>
                        </motion.div>
                    </motion.div>
                )}

                {/* STEP 3: SUCCESS DETAILS */}
                {step === 'success' && (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative z-10 w-full max-w-2xl"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                            {/* Left: Summary Card */}
                            <div className="lg:col-span-3 space-y-6">
                                <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                                            <Gift className="w-8 h-8 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-orange-500 uppercase tracking-widest">Transaction Success</p>
                                            <h3 className="text-2xl font-black text-slate-900 leading-tight">Feature Boost Active</h3>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                                    <Tag className="w-5 h-5 text-orange-500" />
                                                </div>
                                                <span className="font-bold text-slate-600">Selected Plan</span>
                                            </div>
                                            <span className="font-black text-slate-900 text-lg">{planName}</span>
                                        </div>

                                        <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                                    <Calendar className="w-5 h-5 text-violet-500" />
                                                </div>
                                                <span className="font-bold text-slate-600">Boost Duration</span>
                                            </div>
                                            <span className="font-black text-slate-900 text-lg">{duration} {unit}{duration !== '1' ? 's' : ''}</span>
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-slate-100">
                                        <div className="flex items-center gap-2 text-emerald-500">
                                            <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                                                <Check className="w-4 h-4" />
                                            </div>
                                            <p className="font-black text-sm uppercase tracking-wider">Boost Status: Live</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <Link href="/deals"
                                        className="flex-1 group flex items-center justify-center gap-3 px-8 py-5 bg-slate-900 hover:bg-orange-600 text-white rounded-[1.5rem] font-black transition-all shadow-xl shadow-slate-900/10 active:scale-95">
                                        Manage Offers <ArrowRight className="w-5 h-5 group-hover:translate-x-1" />
                                    </Link>
                                    <Link href="/subscription"
                                        className="px-8 py-5 bg-white border-2 border-slate-100 hover:border-orange-200 text-slate-600 rounded-[1.5rem] font-black transition-all hover:shadow-lg">
                                        Billing
                                    </Link>
                                </div>
                            </div>

                            {/* Right: Next Steps */}
                            <div className="lg:col-span-2 space-y-4">
                                <div className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-[2.5rem] p-8 text-white h-full shadow-2xl relative overflow-hidden">
                                    <Sparkles className="absolute -top-4 -right-4 w-24 h-24 text-white/5 rotate-12" />
                                    
                                    <h4 className="text-lg font-black mb-6 uppercase tracking-widest text-orange-400">Next Steps</h4>
                                    
                                    <div className="space-y-6">
                                        {[
                                            { title: 'Search Boost', desc: 'Your offers now appear first in results.' },
                                            { title: 'Badge Activation', desc: 'A "Featured" badge is now visible.' },
                                            { title: 'Analytics Sync', desc: 'Track new traffic in your dashboard.' }
                                        ].map((step, i) => (
                                            <div key={i} className="flex gap-4">
                                                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center shrink-0 font-black text-xs">
                                                    {i + 1}
                                                </div>
                                                <div>
                                                    <p className="font-black text-sm leading-tight mb-1">{step.title}</p>
                                                    <p className="text-xs text-white/50 font-bold">{step.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-12 p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
                                        <p className="text-[10px] font-black text-white/30 uppercase mb-1">Redirecting to Dashboard</p>
                                        <p className="text-2xl font-black text-orange-500">{countdown}s</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function OfferPlanSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-orange-100 rounded-full" />
                    <div className="absolute top-0 left-0 w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}

