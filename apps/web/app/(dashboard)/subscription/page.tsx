"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CreditCard, CheckCircle2, Clock, Zap, Check,
    AlertTriangle, FileText, Download, X, ChevronRight, Loader2,
    BadgeCheck, RefreshCw, Eye
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Plan {
    id: string;
    name: string;
    planType: string;
    description: string;
    price: number | string;
    billingCycle: string;
    maxListings: number;
    isFeatured: boolean;
    isActive: boolean;
    dashboardFeatures: Record<string, any>;
}

interface Subscription {
    id: string;
    status: string;
    startDate: string;
    endDate: string;
    amount: number;
    plan: Plan;
    autoRenew: boolean;
}

interface Invoice {
    id: string;
    invoiceNumber: string;
    amount: number;
    currency: string;
    status: string;
    paidAt: string;
    createdAt: string;
    paymentGateway: string;
    subscription?: { plan?: Plan };
}

/* ─── Invoice Modal ─────────────────────────────────────────────────────── */
function InvoiceModal({ invoiceId, onClose, user }: { invoiceId: string; onClose: () => void; user: any }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        api.subscriptions.getInvoice(invoiceId).then(setData).catch(console.error).finally(() => setLoading(false));
    }, [invoiceId]);

    const handlePrint = () => {
        if (!printRef.current) return;
        const content = printRef.current.innerHTML;
        const w = window.open('', '_blank');
        if (!w) return;
        w.document.write(`<html><head><title>Invoice</title>
            <style>
                body { font-family: system-ui, sans-serif; padding: 40px; color: #0f172a; }
                .logo { font-size: 24px; font-weight: 900; color: #f97316; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 12px 16px; text-align: left; }
                th { background: #f8fafc; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; }
                .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; background: #fff7ed; color: #f97316; }
                .total-row { border-top: 2px solid #f1f5f9; font-weight: 900; }
            </style>
        </head><body>${content}</body></html>`);
        w.document.close();
        w.print();
    };

    const txn = data?.transaction;
    const vendor = data?.vendor;
    const userInfo = data?.user;
    const plan = txn?.subscription?.plan;
    const invDate = txn?.paidAt ? new Date(txn.paidAt) : new Date(txn?.createdAt);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900">Invoice</h2>
                            {txn && <p className="text-xs text-slate-400 font-bold">{txn.invoiceNumber || txn.id}</p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {!loading && txn && (
                            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-black transition-colors">
                                <Download className="w-3.5 h-3.5" /> Print / Save PDF
                            </button>
                        )}
                        <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="overflow-y-auto max-h-[75vh]">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                        </div>
                    ) : !txn ? (
                        <div className="text-center py-16 text-slate-400 font-bold">Invoice not found</div>
                    ) : (
                        <div ref={printRef} className="p-8">
                            {/* Invoice Header */}
                            <div className="flex items-start justify-between mb-10">
                                <div>
                                    <div className="logo text-2xl font-black text-orange-500 mb-1">naampata</div>
                                    <p className="text-xs text-slate-400 font-bold">Business Listings Platform</p>
                                </div>
                                <div className="text-right">
                                <div className="inline-block px-4 py-1.5 bg-orange-50 text-orange-700 rounded-full text-xs font-black uppercase tracking-wider mb-2">
                                    {txn.status === 'completed' ? '✓ Paid' : txn.status}
                                </div>
                                    <p className="text-sm font-black text-slate-900">{txn.invoiceNumber || `INV-${txn.id.slice(0, 8).toUpperCase()}`}</p>
                                    <p className="text-xs text-slate-400 font-bold mt-0.5">
                                        {invDate.toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>

                            {/* Billed To */}
                            <div className="grid grid-cols-2 gap-8 mb-10 pb-8 border-b border-slate-100">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-2">Billed To</p>
                                    <p className="font-black text-slate-900">{vendor?.businessName || userInfo?.fullName}</p>
                                    <p className="text-sm text-slate-500 font-bold mt-1">{userInfo?.email}</p>
                                    {userInfo?.phone && <p className="text-sm text-slate-500 font-bold">{userInfo?.phone}</p>}
                                    {vendor?.ntnNumber && <p className="text-xs text-slate-400 font-bold mt-1">NTN: {vendor.ntnNumber}</p>}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-2">Payment Details</p>
                                    <p className="text-sm font-black text-slate-900">Method: {txn.paymentGateway || 'Online'}</p>
                                    <p className="text-sm text-slate-500 font-bold mt-1">
                                        Billing: {txn.subscription?.plan?.billingCycle || 'Monthly'}
                                    </p>
                                    {txn.paidAt && (
                                        <p className="text-xs text-slate-400 font-bold mt-1">
                                            Paid: {new Date(txn.paidAt).toLocaleDateString('en-PK')}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Items Table */}
                            <table className="w-full mb-6">
                                <thead>
                                    <tr className="bg-slate-50 rounded-xl">
                                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 rounded-l-xl">Description</th>
                                        <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Period</th>
                                        <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-slate-400 rounded-r-xl">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-slate-50">
                                        <td className="px-4 py-4">
                                            <p className="font-black text-slate-900">{plan?.name || 'Subscription Plan'}</p>
                                            <p className="text-xs text-slate-400 font-bold mt-0.5">
                                                {plan?.planType?.toUpperCase()} · Up to {plan?.maxListings || 1} listing(s)
                                            </p>
                                        </td>
                                        <td className="px-4 py-4 text-center text-sm text-slate-500 font-bold">
                                            {plan?.billingCycle || 'Monthly'}
                                        </td>
                                        <td className="px-4 py-4 text-right font-black text-slate-900">
                                            PKR {Number(txn.amount).toLocaleString()}
                                        </td>
                                    </tr>
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan={2} className="px-4 py-4 text-right text-sm font-black text-slate-500 uppercase tracking-wider">Total</td>
                                        <td className="px-4 py-4 text-right text-xl font-black text-slate-900">
                                            PKR {Number(txn.amount).toLocaleString()}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>

                            {/* Footer note */}
                            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                                <p className="text-xs text-slate-400 font-bold">Thank you for your business! For queries, contact support@naampata.com</p>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

/* ─── Plan Card ─────────────────────────────────────────────────────────── */
function PlanCard({ plan, isActive, status, hasActivePaidPlan, onSelect, loading }: {
    plan: Plan;
    isActive: boolean;         // This plan IS the currently active plan
    status?: string;           // Status of the active subscription
    hasActivePaidPlan: boolean; // Business currently has any paid (non-free) active plan
    onSelect: () => void;
    loading: boolean;
}) {
    const getColor = (type: string) => {
        const colors: Record<string, { text: string; icon: string; accent: string }> = {
            free:  { text: 'text-slate-500', icon: 'text-slate-400', accent: 'bg-slate-100' },
        };
        return colors[type] || { text: 'text-orange-600',  icon: 'text-orange-500',  accent: 'bg-orange-100'  };
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'free':  return <Clock className="w-5 h-5" />;
            default:      return <Zap className="w-5 h-5" />;
        }
    };

    const clr       = getColor(plan.planType);
    const planPrice = Number(plan.price);
    const isFree    = plan.planType === 'free';
    const isPending = isActive && status === 'pending';

    // Free plan is locked — it is the default fallback, not a selectable plan
    // Paid plan (Basic) is always rechargeable, even when currently active
    const isLocked   = isFree;                         // free plan: never directly selectable
    const isRecharge = isActive && !isFree && !isPending; // active paid plan: show Recharge

    // Border / background styling
    const cardStyle = isActive && !isFree
        ? isPending
            ? 'border-amber-300 bg-amber-50/30'
            : 'border-orange-400 bg-gradient-to-b from-orange-50 to-white shadow-lg shadow-orange-100'
        : isFree
            ? 'border-slate-100 bg-slate-50/60'
            : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-md';

    // Button label + style
    const btnContent = () => {
        if (loading)    return <Loader2 className="w-4 h-4 animate-spin" />;
        if (isFree)     return <><CheckCircle2 className="w-4 h-4" /> Always Included</>;
        if (isPending)  return <><Clock className="w-4 h-4" /> Pending Approval</>;
        if (isRecharge) return <><RefreshCw className="w-4 h-4" /> Recharge Monthly</>;
        return <>Activate Plan <ChevronRight className="w-4 h-4" /></>;
    };

    const btnClass = isFree
        ? 'bg-slate-100 text-slate-400 cursor-default'
        : isPending
            ? 'bg-amber-100 text-amber-700 cursor-default'
            : isRecharge
                ? 'bg-[#FF7A30] hover:bg-[#E86920] text-white shadow-lg shadow-orange-900/10 cursor-pointer'
                : 'bg-slate-900 hover:bg-black text-white shadow-lg shadow-slate-900/10 cursor-pointer';

    return (
        <motion.div
            whileHover={isFree ? {} : { y: -4 }}
            className={`relative rounded-2xl border-2 p-6 flex flex-col transition-all ${cardStyle}`}
        >
            {/* Badge: Current Plan or Pending */}
            {isActive && !isFree && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-white text-[10px] font-black uppercase tracking-widest rounded-full whitespace-nowrap ${isPending ? 'bg-amber-500' : 'bg-orange-500'}`}>
                    {isPending ? '⌛ Pending' : '✓ Current Plan'}
                </div>
            )}
            {isFree && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-slate-400 text-white text-[10px] font-black uppercase tracking-widest rounded-full whitespace-nowrap">
                    Default Free
                </div>
            )}

            {/* Plan identity */}
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl ${clr.accent} ${clr.icon} flex items-center justify-center`}>
                    {getIcon(plan.planType)}
                </div>
                <div>
                    <h3 className="font-black text-slate-900 text-base">{plan.name}</h3>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${clr.text}`}>{plan.planType}</p>
                </div>
            </div>

            {/* Price */}
            <div className="mb-5">
                <div className="flex items-baseline gap-1">
                    {planPrice === 0 ? (
                        <span className="text-3xl font-black text-slate-400">Free</span>
                    ) : (
                        <>
                            <span className="text-3xl font-black text-slate-900">PKR {planPrice.toLocaleString()}</span>
                            <span className="text-slate-400 font-bold text-sm">/{plan.billingCycle}</span>
                        </>
                    )}
                </div>
                {!isFree && (
                    <p className="text-xs text-slate-400 font-bold mt-1">
                        {plan.billingCycle?.toLowerCase() === 'yearly'
                            ? 'Billed yearly · Each recharge extends by 1 year'
                            : 'Billed monthly · Each recharge extends by 1 month'}
                    </p>
                )}
                <p className="text-slate-500 font-bold text-sm mt-2 leading-relaxed">{plan.description || 'Grow your business visibility'}</p>
            </div>

            {/* Feature list */}
            <div className="space-y-2.5 flex-1 mb-6">
                {plan.dashboardFeatures && Object.entries(plan.dashboardFeatures).map(([key, enabled]) => {
                    if (!enabled || key === 'maxKeywords') return null;
                    const labels: Record<string, string> = {
                        showListings:  'My Listings',
                        canAddListing: 'Add Listing',
                        showLeads:     'Leads',
                        showOffers:    'Offers & Events',
                        showReviews:   'Reviews',
                        showAnalytics: 'Analytics',
                        showSaved:     'Saved',
                        showFollowing: 'Following',
                        showQueries:   'Queries',
                        showChat:      'Live Chat',
                        showBroadcast: 'Broadcast Feed (view)',
                        canRespondBroadcast: 'Respond to Broadcast Leads',
                        canReplyReviews: 'Reply to Customer Reviews',
                        showDemand:    'Hot Demand Insights',
                    };
                    const label = labels[key] || key.replace('show', '').replace(/([A-Z])/g, ' $1').trim();
                    return (
                        <div key={key} className="flex items-start gap-2.5">
                            <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${isFree ? 'bg-slate-100' : 'bg-emerald-50'}`}>
                                <Check className={`w-2.5 h-2.5 stroke-[3] ${isFree ? 'text-slate-400' : 'text-emerald-500'}`} />
                            </div>
                            <span className={`font-bold text-sm leading-tight ${isFree ? 'text-slate-400' : 'text-slate-600'}`}>{label}</span>
                        </div>
                    );
                })}
                <div className="flex items-center gap-2.5 pt-1">
                    <div className="w-4 h-4 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-2.5 h-2.5 text-blue-500" />
                    </div>
                    <span className="font-black text-slate-700 text-sm">
                        {(plan.dashboardFeatures?.maxListings ?? plan.maxListings ?? 0) >= 999 ? 'Unlimited Listings' : `${plan.dashboardFeatures?.maxListings ?? plan.maxListings ?? 0} Listing${(plan.dashboardFeatures?.maxListings ?? plan.maxListings ?? 0) !== 1 ? 's' : ''}`}
                    </span>
                </div>
            </div>

            {/* CTA Button */}
            <button
                onClick={onSelect}
                disabled={isFree || isPending || loading}
                className={`w-full py-3 rounded-xl font-black text-sm transition-all active:scale-[0.97] flex items-center justify-center gap-2 disabled:opacity-70 ${btnClass}`}
            >
                {btnContent()}
            </button>
        </motion.div>
    );
}


/* ─── Main Page ─────────────────────────────────────────────────────────── */
export default function BusinessSubscriptionPage() {
    const { user, loading: authLoading, syncProfile } = useAuth();
    const router = useRouter();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [activeSub, setActiveSub] = useState<Subscription | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loadingPage, setLoadingPage] = useState(true);
    const [checkingOut, setCheckingOut] = useState<string | null>(null);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
    const [tab, setTab] = useState<'plan' | 'invoices'>('plan');
    const [successMsg, setSuccessMsg] = useState('');
    const [agreed, setAgreed] = useState(false);
    const [billingCycleFilter, setBillingCycleFilter] = useState<'Monthly' | 'Yearly'>('Monthly');

    // Safety-net guard: only businesses can access this page
    // Wait for auth to finish loading before checking role to avoid premature redirects
    useEffect(() => {
        if (authLoading) return; // Don't redirect while auth is still initializing
        if (!user) {
            router.replace('/login');
        } else if (user.role !== 'vendor') {
            router.replace('/');
        }
    }, [user, authLoading, router]);

    const fetchAll = async () => {
        setLoadingPage(true);
        try {
            const [p, s, inv] = await Promise.all([
                api.subscriptions.getPlans(),
                api.subscriptions.getActive().catch(() => null),
                api.subscriptions.getMyInvoices().catch(() => []),
            ]);
            setPlans(Array.isArray(p) ? p : []);
            
            const isAdminUser = user?.role === 'admin' || user?.role === 'superadmin';
            if (isAdminUser) {
                setActiveSub({
                    id: 'super-admin-mock',
                    status: 'active',
                    startDate: new Date().toISOString(),
                    endDate: s?.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                    amount: 0,
                    plan: {
                        id: 'super-admin-id',
                        name: 'Super Admin',
                        planType: 'paid',
                        description: 'Full unrestricted access to all business management tools.',
                        price: 0,
                        billingCycle: 'Yearly',
                        maxListings: 999,
                        isFeatured: true,
                        isActive: true,
                        dashboardFeatures: {
                            showListings: true,
                            canAddListing: true,
                            showSaved: true,
                            showFollowing: true,
                            showQueries: true,
                            showLeads: true,
                            showOffers: true,
                            showReviews: true,
                            showAnalytics: true,
                            showChat: true,
                            showBroadcast: true,
                            showDemand: true,
                            maxKeywords: 999
                        }
                    },
                    autoRenew: true
                });
            } else {
                setActiveSub(s);
            }

            setInvoices(Array.isArray(inv) ? inv : []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingPage(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const handleSelectPlan = async (plan: Plan) => {
        // Free plan is never directly selectable — it's the automatic fallback
        if (plan.planType === 'free') return;

        if (!agreed) {
            alert('Please agree to the Terms & Conditions and Privacy Policy first by checking the box below the plans.');
            return;
        }

        const isRecharge = activeSub?.plan?.id === plan.id;

        const cycleLabel = plan.billingCycle?.toLowerCase() === 'yearly' ? 'year' : 'month';
        const extensionLabel = plan.billingCycle?.toLowerCase() === 'yearly' ? '1 year' : '1 month';
        const confirmMsg = isRecharge
            ? `Recharge your ${plan.name} plan for another ${extensionLabel}?\n\nYou will be charged PKR ${Number(plan.price).toLocaleString()} via Stripe.`
            : `Activate the ${plan.name} plan?\n\nYou will be charged PKR ${Number(plan.price).toLocaleString()}/${cycleLabel} via Stripe.`;

        if (!confirm(confirmMsg)) return;

        setCheckingOut(plan.id);
        try {
            const res = await api.subscriptions.createCheckout(plan.id);
            if (res.checkoutUrl) {
                window.location.href = res.checkoutUrl;
                return; // Stripe checkout — browser navigates away
            }
            // Fallback: free plan mock success (shouldn't reach here for paid plans)
            setSuccessMsg(`🎉 Successfully activated ${plan.name}!`);
            setTimeout(() => setSuccessMsg(''), 4000);
            await fetchAll();
            await syncProfile();
        } catch (err: any) {
            alert(err.message || 'Failed to process plan. Please try again.');
        } finally {
            setCheckingOut(null);
        }
    };

    // Days until expiry
    const daysLeft = activeSub ? Math.ceil((new Date(activeSub.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
    const isExpiringSoon = daysLeft !== null && daysLeft <= 4;

    const statusBadge = (status: string) => {
        const map: Record<string, string> = {
            completed: 'bg-emerald-50 text-emerald-700',
            pending: 'bg-amber-50 text-amber-700',
            failed: 'bg-red-50 text-red-700',
            refunded: 'bg-slate-100 text-slate-500',
        };
        return map[status] || 'bg-slate-100 text-slate-500';
    };

    if (loadingPage) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-slate-200" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto pb-20 space-y-8">
            {/* ── Header ── */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0B2244] via-[#0D2E61] to-[#1a3a70] p-8 shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                <div className="relative">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-orange-500/20 flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-orange-400" />
                        </div>
                        <h1 className="text-2xl font-black text-white">Subscription & Billing</h1>
                    </div>
                    <p className="text-blue-200 font-bold text-sm">Manage your listing plan, view invoices, and upgrade anytime.</p>
                </div>
            </div>

            {/* ── Success Banner ── */}
            <AnimatePresence>
                {successMsg && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 font-black flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                        {successMsg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Active Plan Banner ── */}
            {activeSub ? (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-2xl p-6 border-2 ${isExpiringSoon
                        ? 'bg-red-50 border-red-200'
                        : 'bg-gradient-to-r from-slate-900 to-slate-800 border-transparent'
                        }`}
                >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                isExpiringSoon ? 'bg-red-100' : 
                                activeSub.status === 'pending' ? 'bg-amber-100' : 'bg-white/10'
                            }`}>
                                {isExpiringSoon ? (
                                    <AlertTriangle className="w-6 h-6 text-red-500" />
                                ) : activeSub.status === 'pending' ? (
                                    <Clock className="w-6 h-6 text-amber-500" />
                                ) : (
                                    <BadgeCheck className="w-6 h-6 text-emerald-400" />
                                )}
                            </div>
                            <div>
                                <p className={`text-xs font-black uppercase tracking-widest mb-1 ${
                                    isExpiringSoon ? 'text-red-400' : 
                                    activeSub.status === 'pending' ? 'text-amber-500' : 'text-slate-400'
                                }`}>
                                    {isExpiringSoon ? '⚠ Expiring Soon' : 
                                     activeSub.status === 'pending' ? '⌛ Awaiting Admin Approval' : 'Active Plan'}
                                </p>
                                <h2 className={`text-xl font-black ${isExpiringSoon ? 'text-red-700' : 'text-white'}`}>
                                    {activeSub.plan?.name}
                                </h2>
                                {activeSub.status === 'active' && activeSub.plan?.planType !== 'free' && activeSub.plan?.name?.toLowerCase() !== 'free' && (
                                    <p className={`text-sm font-bold mt-0.5 ${isExpiringSoon ? 'text-red-500' : 'text-slate-400'}`}>
                                        {daysLeft !== null && daysLeft > 3000 ? (
                                            <span className="text-emerald-400">Lifetime Plan</span>
                                        ) : (
                                            daysLeft !== null && daysLeft > 0
                                                ? `Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} · ${new Date(activeSub.endDate).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}`
                                                : `Expires: ${new Date(activeSub.endDate).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}`
                                        )}
                                    </p>
                                )}

                                {activeSub.status === 'pending' && (
                                    <p className="text-sm font-bold text-amber-400/80 mt-0.5">
                                        Your payment is under review. Please wait for admin activation.
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className={`text-center px-5 py-3 rounded-xl ${isExpiringSoon ? 'bg-red-100' : 'bg-white/10'}`}>
                                <p className={`text-xs font-black uppercase tracking-wider ${isExpiringSoon ? 'text-red-400' : 'text-slate-400'}`}>Amount</p>
                                <p className={`text-lg font-black ${isExpiringSoon ? 'text-red-700' : 'text-white'}`}>{(Number(activeSub.amount) === 0 && activeSub.plan?.planType === 'free') ? 'Free' : `PKR ${Number(activeSub.amount).toLocaleString()}`}</p>
                            </div>
                            {isExpiringSoon && (
                                <button
                                    onClick={() => setTab('plan')}
                                    className="flex items-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-black text-sm transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" /> Renew Now
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            ) : (
                <div className="rounded-2xl p-6 bg-amber-50 border-2 border-amber-200 flex items-center gap-4">
                    <AlertTriangle className="w-8 h-8 text-amber-500 flex-shrink-0" />
                    <div>
                        <h3 className="font-black text-amber-900">No Active Subscription</h3>
                        <p className="text-amber-700 font-bold text-sm mt-0.5">Choose a plan below to start listing your business.</p>
                    </div>
                </div>
            )}

            {/* ── Tabs ── */}
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit">
                {['plan', 'invoices'].map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t as any)}
                        className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all capitalize ${tab === t ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        {t === 'plan' ? '📦 Plans' : '📑 Invoices'}
                    </button>
                ))}
            </div>

            {/* ── Tab Content ── */}
            <AnimatePresence mode="wait">
                {tab === 'plan' && (
                    <motion.div key="plan" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }}>
                        {plans.length === 0 ? (
                            <div className="text-center py-20 text-slate-400 font-bold">No plans available yet. Please check back later.</div>
                        ) : (
                            <>
                                <div className="flex justify-center mb-10">
                                    <div className="bg-slate-100 p-1 rounded-2xl flex items-center shadow-inner">
                                        <button 
                                            onClick={() => setBillingCycleFilter('Monthly')}
                                            className={`px-8 py-2.5 rounded-xl font-black text-sm transition-all ${billingCycleFilter === 'Monthly' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            Monthly Plans
                                        </button>
                                        <button 
                                            onClick={() => setBillingCycleFilter('Yearly')}
                                            className={`px-8 py-2.5 rounded-xl font-black text-sm transition-all ${billingCycleFilter === 'Yearly' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            Yearly Plans
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                    {plans
                                        .filter(plan => {
                                            if (plan.planType === 'free') return true;
                                            return plan.billingCycle?.toLowerCase() === billingCycleFilter.toLowerCase();
                                        })
                                        .filter(plan => {
                                            if (plan.planType === 'free' && plan.billingCycle?.toLowerCase() === 'yearly') return false;
                                            return true;
                                        })
                                        .map(plan => (
                                        <PlanCard
                                            key={plan.id}
                                            plan={plan}
                                            isActive={activeSub?.plan?.id === plan.id}
                                            status={activeSub?.status}
                                            hasActivePaidPlan={!!activeSub && Number(activeSub.plan?.price ?? 0) > 0}
                                            onSelect={() => handleSelectPlan(plan)}
                                            loading={checkingOut === plan.id}
                                        />
                                    ))}
                                </div>
                                <div className="mt-8 border-t border-slate-200 pt-6 max-w-2xl mx-auto">
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <div className="relative flex items-center justify-center mt-0.5">
                                            <input
                                                type="checkbox"
                                                checked={agreed}
                                                onChange={(e) => setAgreed(e.target.checked)}
                                                className="w-5 h-5 appearance-none border-2 border-slate-300 rounded-lg checked:border-orange-500 checked:bg-orange-500 transition-colors cursor-pointer peer"
                                            />
                                            <svg className="w-3.5 h-3.5 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        </div>
                                        <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors text-left">
                                            I agree to the <a href="/terms" target="_blank" className="text-orange-500 font-bold hover:underline">Terms & Conditions</a> and <a href="/privacy" target="_blank" className="text-orange-500 font-bold hover:underline">Privacy Policy</a>, and acknowledge that subscribing to a plan constitutes a legal obligation.
                                        </span>
                                    </label>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}

                {tab === 'invoices' && (
                    <motion.div key="invoices" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }}>
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                                    <FileText className="w-4 h-4 text-orange-500" />
                                </div>
                                <h3 className="font-black text-slate-900">Invoice History</h3>
                                <span className="ml-auto text-xs font-black text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{invoices.length} records</span>
                            </div>
                            {invoices.length === 0 ? (
                                <div className="text-center py-16 text-slate-400">
                                    <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                    <p className="font-bold">No invoices yet</p>
                                    <p className="text-sm mt-1">Invoices will appear here after plan activation.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-slate-50">
                                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-300">Invoice #</th>
                                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-300">Plan</th>
                                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-300">Amount</th>
                                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-300">Date</th>
                                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-300">Status</th>
                                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-300">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {invoices.map((inv, i) => (
                                                <motion.tr
                                                    key={inv.id}
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.04 }}
                                                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                                                >
                                                    <td className="px-6 py-4">
                                                        <p className="font-black text-slate-900 text-sm">{inv.invoiceNumber || `INV-${inv.id.slice(0, 8).toUpperCase()}`}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-bold text-slate-600">
                                                        {inv.subscription?.plan?.name || '—'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="font-black text-slate-900">PKR {Number(inv.amount).toLocaleString()}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-bold text-slate-400">
                                                        {new Date(inv.paidAt || inv.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-black ${statusBadge(inv.status)}`}>
                                                            {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => setSelectedInvoiceId(inv.id)}
                                                            className="flex items-center gap-1.5 ml-auto px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-black text-xs transition-colors"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" /> View
                                                        </button>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Invoice Modal ── */}
            <AnimatePresence>
                {selectedInvoiceId && (
                    <InvoiceModal
                        invoiceId={selectedInvoiceId}
                        onClose={() => setSelectedInvoiceId(null)}
                        user={user}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
