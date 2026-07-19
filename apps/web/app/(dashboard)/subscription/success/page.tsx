'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2,
    ArrowRight,
    Calendar,
    CreditCard,
    ChevronRight,
    Loader2,
    AlertCircle,
    PartyPopper,
    ShieldCheck,
    Zap,
    FileText,
    Download,
    X
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRef } from 'react';
import toast from 'react-hot-toast';

/* ─── Invoice Modal ─────────────────────────────────────────────────────── */
function InvoiceModal({ invoiceId, onClose }: { invoiceId: string; onClose: () => void }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        api.subscriptions.getInvoice(invoiceId).then(setData).catch(console.error).finally(() => setLoading(false));
    }, [invoiceId]);

    const handlePrint = () => {
        if (!printRef.current) return;
        const content = printRef.current.innerHTML.replace(/dark:[^\s"']+/g, '').replace(/text-white/g, 'text-black');
        const w = window.open('', '_blank');
        if (!w) return;
        w.document.write(`<html><head><title>Invoice</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
                @media print {
                    @page { margin: 0.5cm; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            </style>
        </head><body class="bg-white text-slate-900 p-8 antialiased">
            ${content}
            <script>
                setTimeout(() => { window.print(); }, 1500);
            </script>
        </body></html>`);
        w.document.close();
    };

    const txn = data?.transaction;
    const vendor = data?.vendor;
    const userInfo = data?.user;
    const plan = txn?.subscription?.plan || txn?.pricingPlan;
    const invDate = txn?.paidAt ? new Date(txn.paidAt) : new Date(txn?.createdAt);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-900/10 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 dark:text-white">Invoice</h2>
                            {txn && <p className="text-xs text-slate-400 font-bold">{txn.invoiceNumber || txn.id}</p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {!loading && txn && (
                            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl text-xs font-black hover:opacity-90 transition-all">
                                <Download className="w-3.5 h-3.5" /> Print / Save PDF
                            </button>
                        )}
                        <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="overflow-y-auto max-h-[75vh]">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : !txn ? (
                        <div className="text-center py-16 text-slate-400 font-bold">Invoice not found</div>
                    ) : (
                        <div ref={printRef} className="p-8">
                            {/* Invoice Header */}
                            <div className="flex items-start justify-between mb-10 text-slate-900 dark:text-white">
                                <div>
                                    <div className="text-2xl font-black text-orange-500 mb-1">naampata</div>
                                    <p className="text-xs text-slate-400 font-bold">Business Listings Platform</p>
                                </div>
                                <div className="text-right">
                                <div className="inline-block px-4 py-1.5 bg-green-500/10 text-green-500 rounded-full text-xs font-black uppercase tracking-wider mb-2">
                                    {txn.status === 'completed' ? '✓ Paid' : txn.status}
                                </div>
                                    <p className="text-sm font-black">{txn.invoiceNumber || `INV-${txn.id.slice(0, 8).toUpperCase()}`}</p>
                                    <p className="text-xs text-slate-400 font-bold mt-0.5">
                                        {invDate.toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>

                            {/* Billed To */}
                            <div className="grid grid-cols-2 gap-8 mb-10 pb-8 border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-2">Billed To</p>
                                    <p className="font-black">{vendor?.businessName || userInfo?.fullName}</p>
                                    <p className="text-sm text-slate-500 font-bold mt-1">{userInfo?.email}</p>
                                    {userInfo?.phone && <p className="text-sm text-slate-500 font-bold">{userInfo?.phone}</p>}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-2">Payment Details</p>
                                    <p className="text-sm font-black">Method: {txn.paymentGateway || 'Stripe'}</p>
                                    <p className="text-sm text-slate-500 font-bold mt-1">
                                        Ref: {txn.gatewayTransactionId?.slice(-12)}
                                    </p>
                                </div>
                            </div>

                            {/* Items Table */}
                            <table className="w-full mb-6">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 rounded-l-xl">Description</th>
                                        <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-slate-400 rounded-r-xl">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-slate-50 dark:border-slate-800/50">
                                        <td className="px-4 py-4">
                                            <p className="font-black text-slate-900 dark:text-white">{plan?.name || 'Subscription Plan'}</p>
                                            <p className="text-xs text-slate-400 font-bold mt-0.5">
                                                Active Subscription Service
                                            </p>
                                        </td>
                                        <td className="px-4 py-4 text-right font-black text-slate-900 dark:text-white">
                                            PKR {Number(txn.amount).toLocaleString()}
                                        </td>
                                    </tr>
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td className="px-4 py-6 text-right text-sm font-black text-slate-500 uppercase tracking-wider">Total</td>
                                        <td className="px-4 py-6 text-right text-2xl font-black text-slate-900 dark:text-white">
                                            PKR {Number(txn.amount).toLocaleString()}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

function SuccessContent() {
    const router = useRouter();
    const { syncProfile } = useAuth();
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const [status, setStatus] = useState<'loading' | 'celebrating' | 'success' | 'error'>('loading');
    const [planDetails, setPlanDetails] = useState<any>(null);
    const [showInvoice, setShowInvoice] = useState(false);

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
            }, 3000); // 3 seconds of celebration
            return () => clearTimeout(timer);
        }
    }, [status]);

    const verifyPayment = async () => {
        try {
            const response = await api.subscriptions.verify(sessionId!);
            if (response.success) {
                setPlanDetails(response);

                toast.success('Congratulations! Your plan is active.', { duration: 4000 });
                setStatus('success');

                // NEW: Sync profile to ensure vendor benefits are applied immediately in UI
                syncProfile().catch(err => console.error('Feature Sync Error:', err));
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
            {showInvoice && planDetails?.transactionId && (
                <InvoiceModal 
                    invoiceId={planDetails.transactionId} 
                    onClose={() => setShowInvoice(false)} 
                />
            )}
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
                            animate={{
                                scale: [1, 1.1, 1],
                                rotate: [0, 180, 360]
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="w-24 h-24 rounded-3xl border-4 border-primary/10 border-t-primary shadow-[0_0_40px_-10px_rgba(var(--primary),0.3)]"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                    </div>
                    <motion.h2
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-2xl font-black text-slate-900 dark:text-white tracking-tight"
                    >
                        Authenticating Payment
                    </motion.h2>
                    <motion.p
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="mt-2 text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]"
                    >
                        Almost there, securing your account
                    </motion.p>
                </motion.div>
            )}

            {status === 'celebrating' && (
                <motion.div
                    key="celebration"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
                    className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-slate-950 overflow-hidden"
                >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/5 blur-[120px] rounded-full animate-pulse" />

                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", damping: 15, stiffness: 200 }}
                        className="relative"
                    >
                        <div className="w-32 h-32 bg-green-500 rounded-[40px] flex items-center justify-center shadow-[0_20px_60px_rgba(34,197,94,0.4)] relative z-10">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.3, type: "spring" }}
                            >
                                <CheckCircle2 className="w-16 h-16 text-white stroke-[3px]" />
                            </motion.div>
                        </div>

                        {/* Ripple circles */}
                        {[1, 2, 3].map((i) => (
                            <motion.div
                                key={i}
                                initial={{ scale: 1, opacity: 0.5 }}
                                animate={{ scale: 2, opacity: 0 }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}
                                className="absolute inset-0 border-2 border-green-500/20 rounded-[40px]"
                            />
                        ))}
                    </motion.div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-12 text-center"
                    >
                        <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">
                            Success! Your Plan is <span className="text-green-500">Live</span>
                        </h1>
                        <p className="text-xl text-slate-400 font-bold tracking-tight">
                            Hang tight while we prepare your <span className="text-primary italic">new tools</span>
                        </p>
                    </motion.div>
                </motion.div>
            )}

            {status === 'error' && (
                <motion.div
                    key="error"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center"
                >
                    <div className="w-20 h-20 bg-red-100 dark:bg-red-900/10 rounded-3xl flex items-center justify-center mb-8">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Something went wrong</h1>
                    <p className="text-slate-500 dark:text-slate-400 mb-10 max-w-md font-bold text-lg leading-relaxed">
                        We couldn't confirm your subscription. It might still be processing. Please check your dashboard in a few minutes.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Link href="/subscription" className="px-10 py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-black tracking-tight hover:scale-[1.02] transition-all">
                            Back to Pricing
                        </Link>
                        <Link href="/contact" className="px-10 py-4 border-2 border-slate-100 dark:border-slate-800 rounded-2xl font-black text-slate-600 hover:bg-slate-50 transition-all">
                            Support center
                        </Link>
                    </div>
                </motion.div>
            )}

            {status === 'success' && (
                <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl mx-auto py-16 px-6"
                >
                    <div className="text-center mb-16">
                        <div className="flex items-center justify-center gap-4 mb-4">
                            <div className="h-px w-8 bg-slate-200 dark:bg-slate-800" />
                            <ShieldCheck className="w-6 h-6 text-green-500" />
                            <div className="h-px w-8 bg-slate-200 dark:bg-slate-800" />
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">
                            Welcome to the <span className="text-primary italic">{planDetails?.planName || 'Premium Plan'}.</span>
                        </h1>
                        <p className="text-xl text-slate-400 font-bold tracking-tight max-w-2xl mx-auto">
                            Your {planDetails?.planName || 'subscription'} was successfully activated. Here's a quick summary of your account status.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                        {/* Summary Card */}
                        <div className="bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-[20px] p-8 text-left relative group transition-all hover:border-primary/20">
                            <div className="absolute top-8 right-8">
                                <Zap className="w-8 h-8 text-primary/20" />
                            </div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Active Plan</h3>

                            <div className="space-y-6">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-slate-400 font-bold text-sm">Plan</span>
                                    <span className="text-2xl font-black text-slate-900 dark:text-white">{planDetails?.planName || 'Premium Plan'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 font-bold text-sm">Status</span>
                                    <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-500/10 text-green-500 rounded-full text-xs font-black uppercase tracking-widest">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                        Active
                                    </span>
                                </div>
                                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                    <span className="text-slate-400 font-bold text-sm">Valid Until</span>
                                    <span className="font-bold text-slate-600 dark:text-slate-300">
                                        {planDetails?.endDate ? new Date(planDetails.endDate).toLocaleDateString('en-US', {
                                            month: 'long', day: 'numeric', year: 'numeric'
                                        }) : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions Card */}
                        <div className="bg-slate-900 dark:bg-white rounded-[20px] p-8 text-left text-white dark:text-slate-900 relative overflow-hidden flex flex-col justify-between group h-full">
                            <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-primary opacity-10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />

                            <div>
                                <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Onboarding</h3>
                                <h2 className="text-2xl font-black tracking-tight mb-4 leading-tight">Ready to get started?</h2>
                                <p className="text-slate-400 dark:text-slate-500 font-bold text-sm leading-relaxed mb-8">
                                    Start using your premium analytics and AI content tools to attract more customers.
                                </p>
                            </div>

                            <div className="space-y-3">
                            <Link href="/dashboard" className="flex items-center justify-between w-full p-5 bg-white/5 dark:bg-slate-50 hover:bg-white/10 dark:hover:bg-slate-100 rounded-2xl transition-all group/btn">
                                <span className="font-black text-sm">Open Dashboard</span>
                                <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                            </Link>
                            {planDetails?.transactionId && (
                                <button 
                                    onClick={() => setShowInvoice(true)}
                                    className="flex items-center justify-between w-full p-5 bg-white/5 dark:bg-slate-50 hover:bg-white/10 dark:hover:bg-slate-100 rounded-2xl transition-all group/btn"
                                >
                                    <span className="font-black text-sm text-left">Download Invoice</span>
                                    <FileText className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                </button>
                            )}
                            <Link href="/listings" className="flex items-center justify-between w-full p-5 bg-white/5 dark:bg-slate-50 hover:bg-white/10 dark:hover:bg-slate-100 rounded-2xl transition-all group/btn">
                                <span className="font-black text-sm">Optimize Listings</span>
                                <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                            </Link>
                            </div>
                        </div>
                    </div>

                    <div className="pt-10 border-t border-slate-100 dark:border-slate-800 text-center">
                        <p className="text-slate-400 font-bold text-sm">
                            Need help? Reach out to our <Link href="/contact" className="text-primary hover:underline">Priority Support</Link> team.
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default function SubscriptionSuccessPage() {
    return (
        <main className="min-h-[70vh] flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
            <Suspense fallback={<div className="animate-pulse text-muted-foreground font-black uppercase tracking-widest text-[10px]">Verifying...</div>}>
                <SuccessContent />
            </Suspense>
        </main>
    );
}
