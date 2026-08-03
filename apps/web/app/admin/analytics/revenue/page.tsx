"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    DollarSign,
    TrendingUp,
    CreditCard,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCcw,
    ChevronLeft,
    Calendar,
    BarChart3,
    PieChart,
    Users,
    Receipt,
} from 'lucide-react';
import { api } from '../../../../lib/api';
import { formatDistanceToNow } from 'date-fns';

export default function AdminRevenuePage() {
    const [stats, setStats] = useState<any>(null);
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'all' | 'month' | 'week'>('all');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [statsData, paymentsData] = await Promise.all([
                api.admin.getStats(),
                api.admin.affiliate.getPayouts().catch(() => []),
            ]);
            setStats(statsData);
            setPayments(paymentsData || []);
        } catch (err) {
            console.error('Failed to fetch revenue data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const totalPaid = payments.filter((p: any) => p.status === 'paid').reduce((s: number, p: any) => s + (p.amount || 0), 0);
    const totalPending = payments.filter((p: any) => p.status === 'pending').reduce((s: number, p: any) => s + (p.amount || 0), 0);
    const totalApproved = payments.filter((p: any) => p.status === 'approved').reduce((s: number, p: any) => s + (p.amount || 0), 0);

    const monthlyRevenue = stats?.monthlyRevenue || 0;
    const totalRevenue = stats?.totalRevenue || 0;
    const activeSubscriptions = stats?.activeSubscriptions || 0;
    const monthlyGraph = stats?.monthlyGraphData || [];

    return (
        <div className="space-y-7 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                    <Link href="/admin/analytics" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors mb-3">
                        <ChevronLeft className="w-3 h-3" /> Back to Analytics
                    </Link>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-1">
                        Revenue <span className="bg-gradient-to-r from-emerald-500 to-green-500 bg-clip-text text-transparent">Tracking</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-sm">Track platform revenue, subscription payments, and affiliate payouts.</p>
                </div>
                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50 self-start"
                >
                    <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </button>
            </div>

            {/* Revenue Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'bg-emerald-100', textColor: 'text-emerald-600' },
                    { label: 'Monthly Revenue', value: `$${monthlyRevenue.toLocaleString()}`, icon: TrendingUp, color: 'bg-blue-100', textColor: 'text-blue-600' },
                    { label: 'Active Subscriptions', value: activeSubscriptions.toString(), icon: Receipt, color: 'bg-violet-100', textColor: 'text-violet-600' },
                    { label: 'Affiliate Payouts', value: `$${totalPaid.toLocaleString()}`, icon: CreditCard, color: 'bg-orange-100', textColor: 'text-orange-600' },
                ].map(stat => (
                    <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm">
                        <div className={`w-11 h-11 ${stat.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                            <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900 leading-none">{stat.value}</p>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Monthly Revenue Chart */}
            {monthlyGraph.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <h3 className="text-lg font-black text-slate-900 mb-4">Monthly Revenue Trend</h3>
                    <div className="flex items-end gap-3 h-48">
                        {monthlyGraph.map((item: any, i: number) => {
                            const maxVal = Math.max(...monthlyGraph.map((m: any) => m.revenue || m.count || 0), 1);
                            const val = item.revenue || item.count || 0;
                            const heightPct = Math.max((val / maxVal) * 100, 4);
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                    <span className="text-[10px] font-bold text-slate-500">${val.toLocaleString()}</span>
                                    <div
                                        className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg transition-all duration-500 hover:from-emerald-600 hover:to-emerald-500"
                                        style={{ height: `${heightPct}%` }}
                                    />
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">{item.month || item.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Payout Queue Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <h3 className="text-lg font-black text-slate-900 mb-4">Affiliate Payout Summary</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                            <span className="text-sm font-bold text-amber-700">Pending Review</span>
                            <span className="text-lg font-black text-amber-900">${totalPending.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
                            <span className="text-sm font-bold text-blue-700">Approved (Awaiting Payment)</span>
                            <span className="text-lg font-black text-blue-900">${totalApproved.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                            <span className="text-sm font-bold text-emerald-700">Total Paid Out</span>
                            <span className="text-lg font-black text-emerald-900">${totalPaid.toLocaleString()}</span>
                        </div>
                    </div>
                    <Link
                        href="/admin/affiliates/payouts"
                        className="mt-4 w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                    >
                        Manage Payouts <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                </div>

                {/* Revenue by Source */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <h3 className="text-lg font-black text-slate-900 mb-4">Revenue Breakdown</h3>
                    <div className="space-y-3">
                        {[
                            { label: 'Subscriptions', amount: (stats as any)?.revenueBreakdown?.subscriptions || totalRevenue * 0.85, pct: (stats as any)?.revenueBreakdown?.subscriptionsPct || 85, color: 'bg-blue-500' },
                            { label: 'Promotions & Events', amount: (stats as any)?.revenueBreakdown?.promotions || totalRevenue * 0.1, pct: (stats as any)?.revenueBreakdown?.promotionsPct || 10, color: 'bg-violet-500' },
                            { label: 'Other', amount: (stats as any)?.revenueBreakdown?.other || totalRevenue * 0.05, pct: (stats as any)?.revenueBreakdown?.otherPct || 5, color: 'bg-slate-400' },
                        ].map(src => (
                            <div key={src.label} className="flex items-center gap-3">
                                <div className="flex-grow">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-bold text-slate-600">{src.label}</span>
                                        <span className="text-xs font-black text-slate-900">${src.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className={`h-full ${src.color} rounded-full`} style={{ width: `${src.pct}%` }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Payments Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="text-lg font-black text-slate-900">Recent Affiliate Payments</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                                <th className="px-6 py-4">Affiliate</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                                <th className="px-6 py-4">Method</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-5 h-14 bg-slate-50/20" />
                                    </tr>
                                ))
                            ) : payments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400 font-medium">
                                        No payment records yet.
                                    </td>
                                </tr>
                            ) : (
                                payments.slice(0, 10).map((payout: any) => (
                                    <tr key={payout.id} className="hover:bg-slate-50/30 transition-all">
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-slate-900">{payout.affiliate?.user?.fullName || 'Unknown'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-black text-slate-900">${payout.amount?.toFixed(2)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-slate-500">{payout.method}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wide border ${
                                                payout.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                payout.status === 'approved' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                payout.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                                                'bg-amber-50 text-amber-600 border-amber-100'
                                            }`}>
                                                {payout.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs text-slate-400 font-medium">
                                                {new Date(payout.createdAt).toLocaleDateString()}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
