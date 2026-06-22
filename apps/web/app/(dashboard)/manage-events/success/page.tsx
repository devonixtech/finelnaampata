'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CheckCircle2, 
    ArrowRight, 
    Calendar, 
    Tag, 
    ChevronRight,
    Loader2,
    AlertCircle,
    PartyPopper,
    Zap,
    Rocket,
    ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '@/lib/api';

function OfferSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const [status, setStatus] = useState<'loading' | 'celebrating' | 'success' | 'error'>('loading');
    const [details, setDetails] = useState<any>(null);

    useEffect(() => {
        if (sessionId) {
            verifyPayment();
        } else {
            setStatus('error');
        }
    }, [sessionId]);

    // Handle transition from celebrating to success
    useEffect(() => {
        if (status === 'celebrating') {
            const timer = setTimeout(() => {
                setStatus('success');
            }, 3000); 
            return () => clearTimeout(timer);
        }
    }, [status]);

    const verifyPayment = async () => {
        try {
            const response = await api.promotions.verifySession(sessionId!);
            if (response.success) {
                setDetails(response);
                
                // Trigger celebratory confetti
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#3b82f6', '#22c55e', '#f59e0b'],
                    zIndex: 100
                });

                setStatus('celebrating');
            } else {
                setStatus('error');
            }
        } catch (error) {
            console.error('Verification error:', error);
            setStatus('error');
        }
    };

    return (
        <AnimatePresence mode="wait">
            {status === 'loading' && (
                <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center"
                >
                    <div className="relative mb-8">
                        <motion.div 
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-20 h-20 rounded-full border-4 border-primary/10 border-t-primary shadow-xl"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-primary animate-spin" />
                        </div>
                    </div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Verifying Boost Status</h2>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Preparing your visibility jump</p>
                </motion.div>
            )}

            {status === 'celebrating' && (
                <motion.div 
                    key="celebration"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                    className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-slate-950 px-6 overflow-hidden"
                >
                    {/* Radial background animation */}
                    <motion.div 
                        animate={{ 
                            scale: [1, 1.2, 1],
                            opacity: [0.1, 0.2, 0.1]
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute inset-0 bg-gradient-radial from-primary/20 to-transparent blur-3xl"
                    />

                    <motion.div 
                        initial={{ y: 100, scale: 0.5, opacity: 0 }}
                        animate={{ y: 0, scale: 1, opacity: 1 }}
                        transition={{ 
                            type: "spring", 
                            damping: 12, 
                            stiffness: 100,
                            duration: 0.8 
                        }}
                        className="relative"
                    >
                        <div className="w-32 h-32 bg-primary rounded-[40px] flex items-center justify-center shadow-[0_20px_60px_rgba(var(--primary),0.3)] relative z-10">
                            <Rocket className="w-16 h-16 text-white animate-pulse" />
                        </div>
                        
                        {/* Thrust particles */}
                        {[1, 2, 3].map((i) => (
                            <motion.div
                                key={i}
                                initial={{ y: 0, opacity: 0.8 }}
                                animate={{ y: 100, opacity: 0, x: (i - 2) * 20 }}
                                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-orange-500/50 rounded-full blur-sm"
                            />
                        ))}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="mt-12 text-center relative z-10"
                    >
                        <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">
                            Boost <span className="text-primary italic text-shadow-glow">Activated!</span>
                        </h1>
                        <p className="text-xl text-slate-400 font-bold tracking-tight">
                            Your offer is now <span className="text-orange-500">featured</span> across the platform
                        </p>
                    </motion.div>
                </motion.div>
            )}

            {status === 'error' && (
                <motion.div 
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center"
                >
                    <div className="w-20 h-20 bg-red-50 dark:bg-red-900/10 rounded-3xl flex items-center justify-center mb-8">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Verification Pending</h1>
                    <p className="text-slate-500 max-w-sm font-bold mb-8">
                        We're still processing your boost. If your status doesn't update in 5 minutes, please contact support.
                    </p>
                    <Link href="/dashboard" className="px-10 py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-black tracking-tight hover:scale-[1.02] transition-all">
                        Back to Dashboard
                    </Link>
                </motion.div>
            )}

            {status === 'success' && (
                <motion.div 
                    key="success"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-4xl mx-auto py-16 px-6"
                >
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 text-orange-500 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                            <Zap className="w-3 h-3" /> Promotion Confirmed
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">
                            Taking Your Business <span className="text-primary">Higher</span>
                        </h1>
                        <p className="text-xl text-slate-400 font-bold tracking-tight max-w-2xl mx-auto">
                            Your feature boost is now active and will be visible to all users searching for services in your area.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                        {/* Boost Details */}
                        <div className="bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-[35px] p-10 text-left relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                                <Rocket className="w-32 h-32 -rotate-45" />
                            </div>
                            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-10 flex items-center gap-2">
                                <Tag className="w-4 h-4" /> Boost Information
                            </h3>
                            <div className="space-y-6 relative z-10">
                                <div className="flex justify-between items-baseline border-b border-slate-50 dark:border-slate-800 pb-4">
                                    <span className="text-slate-400 font-bold text-sm">Promotion</span>
                                    <span className="text-xl font-black text-slate-900 dark:text-white">{details?.planName || 'Offer Highlight'}</span>
                                </div>
                                <div className="flex justify-between items-center group/item">
                                    <span className="text-slate-400 font-bold text-sm">Valid Until</span>
                                    <span className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-primary" />
                                        {details?.endDate || details?.booking?.endTime ? new Date(details.endDate || details.booking.endTime).toLocaleDateString('en-US', {
                                            month: 'short', day: 'numeric', year: 'numeric'
                                        }) : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Impact Card */}
                        <div className="bg-slate-900 dark:bg-white rounded-[35px] p-10 text-left text-white dark:text-slate-900 relative overflow-hidden h-full flex flex-col justify-between">
                            <div>
                                <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Impact</h3>
                                <h2 className="text-2xl font-black mb-6 leading-tight">Increased visibility means more leads.</h2>
                                <ul className="space-y-4">
                                    <li className="flex items-center gap-3 text-sm font-bold opacity-80">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        Top-of-search priority
                                    </li>
                                    <li className="flex items-center gap-3 text-sm font-bold opacity-80">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        Featured badges on listings
                                    </li>
                                </ul>
                            </div>

                            <div className="pt-10 flex gap-4">
                                <Link href="/manage-events" className="flex-1 text-center py-4 bg-white/10 dark:bg-slate-50 rounded-2xl font-black text-sm hover:bg-white/20 dark:hover:bg-slate-100 transition-all">
                                    Manage Events
                                </Link>
                                <Link href="/dashboard" className="flex-1 text-center py-4 bg-primary rounded-2xl font-black text-sm text-white hover:opacity-90 transition-all">
                                    Dashboard
                                </Link>
                            </div>
                        </div>
                    </div>

                    <p className="text-center text-slate-400 font-bold text-sm">
                        Success! Your boost takes immediate effect. <Link href="/help" className="text-primary hover:underline">Learn more about ranking</Link>.
                    </p>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default function OfferFeatureSuccessPage() {
    return (
        <main className="min-h-[70vh] flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
            <Suspense fallback={<div className="font-black text-slate-400 uppercase tracking-widest text-xs animate-pulse">Initializing...</div>}>
                <OfferSuccessContent />
            </Suspense>
        </main>
    );
}
