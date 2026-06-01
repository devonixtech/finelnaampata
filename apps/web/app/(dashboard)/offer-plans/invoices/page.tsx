'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
    FileText, 
    Sparkles, 
    ArrowLeft, 
    Download, 
    Calendar, 
    CheckCircle2, 
    Clock, 
    ExternalLink,
    AlertCircle,
    TrendingUp,
    ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { format, isValid } from 'date-fns';

const safeFormat = (date: any, formatStr: string, fallback = '—') => {
    if (!date) return fallback;
    const d = new Date(date);
    if (!isValid(d)) return fallback;
    return format(d, formatStr);
};

export default function BusinessInvoicesPage() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [promotions, setPromotions] = useState<any>({ plans: [], boosts: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [invoicesData, promosData] = await Promise.all([
                    api.subscriptions.getMyInvoices({ silent: true }),
                    api.subscriptions.getActivePromotions({ silent: true })
                ]);
                setInvoices(invoicesData);
                setPromotions(promosData);
            } catch (err: any) {
                console.error('Failed to fetch billing data:', err);
                setError('Unable to load your billing history. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'completed': return 'text-green-600 bg-green-50 border-green-100';
            case 'pending': return 'text-orange-600 bg-orange-50 border-orange-100';
            case 'failed': return 'text-red-600 bg-red-50 border-red-100';
            default: return 'text-gray-600 bg-gray-50 border-gray-100';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50/50 p-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    const hasActivePromos = promotions.plans?.length > 0 || promotions.boosts?.length > 0;

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link 
                            href="/offer-plans"
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Billing & Promotions</h1>
                            <p className="text-sm text-gray-500">Manage your active boosts and view purchase history</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full border border-orange-100">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-orange-600">Secure Billing</span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-red-700">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                {/* Active Promotions Section */}
                <section>
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">Active Boosts</h2>
                    </div>

                    {!hasActivePromos ? (
                        <div className="bg-white border border-dashed border-gray-300 rounded-3xl p-12 text-center shadow-sm">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Sparkles className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">No active boosts</h3>
                            <p className="text-gray-500 mb-6 max-w-sm mx-auto text-sm">
                                Boost your visibility by featuring your offers or events on the platform.
                            </p>
                            <Link 
                                href="/offer-plans"
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-orange-200"
                            >
                                <Sparkles className="w-4 h-4" />
                                Upgrade Now
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Listing Feature Plans */}
                            {promotions.plans?.map((plan: any) => (
                                <div key={plan.id} className="bg-white border border-gray-100 rounded-3xl p-6 relative overflow-hidden group hover:border-blue-400 transition-all shadow-sm hover:shadow-xl hover:shadow-blue-50/50">
                                    <div className="absolute top-0 right-0 p-4">
                                        <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-tight border border-blue-100">
                                            {plan.type?.replace('_', ' ')}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100">
                                            <TrendingUp className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 line-clamp-1">{plan.name}</h3>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{plan.target}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm py-2 border-b border-gray-50">
                                            <span className="text-gray-500 flex items-center gap-2"><Clock className="w-4 h-4" /> Expires in</span>
                                            <span className="font-bold text-blue-600">
                                                {plan.endDate ? Math.max(0, Math.ceil((new Date(plan.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : '—'} days
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500 flex items-center gap-2"><Calendar className="w-4 h-4" /> Valid until</span>
                                            <span className="text-gray-900 font-medium">{safeFormat(plan.endDate, 'MMM d, yyyy')}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Offer Boosts */}
                            {promotions.boosts?.map((boost: any) => (
                                <div key={boost.id} className="bg-white border border-gray-100 rounded-3xl p-6 relative overflow-hidden group hover:border-orange-300 transition-all shadow-sm hover:shadow-xl hover:shadow-orange-50/50">
                                    <div className="absolute top-0 right-0 p-4">
                                        <div className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-[10px] font-bold uppercase tracking-tight border border-orange-100">
                                            FEATURED {boost.type}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 border border-orange-100">
                                            <Sparkles className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 line-clamp-1">{boost.target}</h3>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{boost.business}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm py-2 border-b border-gray-50">
                                            <span className="text-gray-500 flex items-center gap-2"><Clock className="w-4 h-4" /> Expires in</span>
                                            <span className="font-bold text-orange-600">
                                                {boost.endDate ? Math.max(0, Math.ceil((new Date(boost.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : '—'} days
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500 flex items-center gap-2"><Calendar className="w-4 h-4" /> Active until</span>
                                            <span className="text-gray-900 font-medium">{safeFormat(boost.endDate, 'MMM d, yyyy')}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Invoices Table */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-orange-100 rounded-lg text-orange-600 border border-orange-200">
                                <FileText className="w-5 h-5" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">Purchase History</h2>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto text-sm">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/80 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Invoice No.</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Amount</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {invoices.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                                No transactions found in your history.
                                            </td>
                                        </tr>
                                    ) : (
                                        invoices.map((invoice: any) => (
                                            <tr key={invoice.id} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="font-semibold text-gray-900">
                                                        {safeFormat(invoice.createdAt, 'MMM d, yyyy')}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 font-mono">
                                                        {safeFormat(invoice.createdAt, 'HH:mm')}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-900 truncate max-w-[220px]">
                                                        {invoice.subscription?.plan?.name || invoice.metadata?.planName || 'Feature Upgrade'}
                                                    </div>
                                                    <div className="text-[10px] text-orange-600 uppercase tracking-tighter font-black">
                                                        {invoice.subscription ? 'Recurring billing' : 'One-time upgrade'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-500">
                                                    <span className="bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                                                        {invoice.invoiceNumber || 'INV-PENDING'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="font-black text-gray-900">
                                                        <span className="text-[10px] text-gray-400 font-normal mr-1">{invoice.currency} </span>
                                                        {parseFloat(invoice.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(invoice.status)}`}>
                                                        {invoice.status?.toLowerCase() === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                                                        {invoice.status || 'Unknown'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <button className="p-2 text-gray-400 hover:text-orange-600 transition-all rounded-xl hover:bg-orange-50 active:scale-95 group-hover:scale-110">
                                                        <Download className="w-5 h-5 shadow-sm" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
