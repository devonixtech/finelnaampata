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
    Wallet,
    Award,
    Clock,
    CheckCircle2
} from 'lucide-react';
import { api } from '../../../../lib/api';
import { formatDistanceToNow } from 'date-fns';

export default function AdminRevenuePage() {
    const [stats, setStats] = useState<any>(null);
    const [payments, setPayments] = useState<any[]>([]);
    const [revenueMetrics, setRevenueMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [statsData, paymentsData, metricsData] = await Promise.all([
                api.admin.getStats(),
                api.admin.affiliate.getPayouts().catch(() => []),
                api.admin.getRevenueMetrics().catch(() => null),
            ]);
            setStats(statsData);
            setPayments(paymentsData || []);
            setRevenueMetrics(metricsData);
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
        <div className="space-y-8 pb-24 max-w-7xl mx-auto">
            {/* Header section with glassmorphism */}
            <div className="relative overflow-hidden rounded-[32px] bg-white p-8 border border-slate-100 shadow-sm mb-8 group">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:translate-x-1/4 transition-transform duration-1000" />
                
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                    <div>
                        <Link href="/admin/analytics" className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 transition-colors mb-4 group/link">
                            <ChevronLeft className="w-3.5 h-3.5 group-hover/link:-translate-x-1 transition-transform" /> Back to Analytics
                        </Link>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-2">
                            Revenue <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">Tracking</span>
                        </h1>
                        <p className="text-slate-500 font-medium text-sm md:text-base max-w-lg">Track overall platform revenue, subscription payments, and manage affiliate payouts in real-time.</p>
                    </div>
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-slate-100 rounded-2xl text-slate-700 font-bold text-sm hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50 self-start active:scale-95"
                    >
                        <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
                    </button>
                </div>
            </div>

            {/* Core Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                {[
                    { label: 'MRR', subLabel: 'Monthly Recurring', value: `Rs. ${(revenueMetrics?.mrr || monthlyRevenue || 0).toLocaleString()}`, icon: TrendingUp, color: 'emerald', trend: '+12%' },
                    { label: 'ARR', subLabel: 'Annual Recurring', value: `Rs. ${(revenueMetrics?.arr || monthlyRevenue * 12 || 0).toLocaleString()}`, icon: DollarSign, color: 'blue', trend: '+15%' },
                    { label: 'Active Subs', subLabel: 'Current Subscribers', value: (revenueMetrics?.activeSubscriptions || activeSubscriptions || 0).toString(), icon: Receipt, color: 'violet', trend: '+5%' },
                    { label: 'Churn Rate', subLabel: 'Monthly Attrition', value: `${revenueMetrics?.churnRate || '0'}%`, icon: ArrowDownRight, color: 'rose', trend: '-2%' },
                ].map((stat, i) => (
                    <div key={i} className="group bg-white rounded-[24px] border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-${stat.color}-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-${stat.color}-500/10 transition-colors duration-500`} />
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className={`w-12 h-12 bg-${stat.color}-50 rounded-2xl flex items-center justify-center text-${stat.color}-500 group-hover:scale-110 transition-transform duration-300`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded-lg bg-${stat.color}-50 text-${stat.color}-600`}>
                                {stat.trend}
                            </span>
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.subLabel}</p>
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="bg-slate-900 rounded-[28px] p-8 text-white shadow-xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/30 rounded-full blur-3xl group-hover:bg-emerald-500/40 transition-colors" />
                    
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md mb-6 border border-white/20">
                            <Award className="w-6 h-6 text-emerald-400" />
                        </div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Average LTV</p>
                        <p className="text-4xl font-black tracking-tight mb-2">Rs. {revenueMetrics?.avgLtv?.toLocaleString() || '0'}</p>
                        <p className="text-sm text-slate-400 font-medium">Average lifetime value per active subscriber</p>
                    </div>
                </div>

                <div className="bg-white rounded-[28px] border border-slate-100 p-8 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 mb-6">
                            <Users className="w-6 h-6" />
                        </div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Subscription Base</p>
                        <p className="text-4xl font-black text-slate-900 tracking-tight mb-2">{revenueMetrics?.totalSubscriptions || 0}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-slate-900 font-bold">{revenueMetrics?.activeSubscriptions || 0}</span> currently active
                    </div>
                </div>

                <div className="bg-white rounded-[28px] border border-slate-100 p-8 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-6">
                            <Wallet className="w-6 h-6" />
                        </div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Affiliate Payouts</p>
                        <p className="text-4xl font-black text-slate-900 tracking-tight mb-2">Rs. {totalPaid.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                        <span className="text-xs font-bold text-amber-700">Pending</span>
                        <span className="text-sm font-black text-amber-900">Rs. {totalPending.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Charts and Tables */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Monthly Revenue Chart */}
                    {monthlyGraph.length > 0 && (
                        <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-black text-slate-900">Revenue Trend</h3>
                                <div className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-wider">This Year</div>
                            </div>
                            <div className="flex items-end gap-3 h-56 pt-6 border-b border-slate-100 pb-2 relative">
                                {/* Grid lines */}
                                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
                                    {[0,1,2,3].map(i => <div key={i} className="w-full h-px bg-slate-50" />)}
                                </div>
                                
                                {monthlyGraph.map((item: any, i: number) => {
                                    const maxVal = Math.max(...monthlyGraph.map((m: any) => m.revenue || m.count || 0), 1);
                                    const val = item.revenue || item.count || 0;
                                    const heightPct = Math.max((val / maxVal) * 100, 5);
                                    return (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative z-10 h-full justify-end">
                                            {/* Tooltip */}
                                            <div className="absolute -top-10 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg transform -translate-y-2 group-hover:translate-y-0">
                                                Rs. {val.toLocaleString()}
                                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45" />
                                            </div>
                                            
                                            <div
                                                className="w-full max-w-[40px] bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-xl transition-all duration-300 group-hover:from-emerald-600 group-hover:to-teal-500 opacity-80 group-hover:opacity-100"
                                                style={{ height: `${heightPct}%` }}
                                            />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.month || item.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Revenue Per Vendor */}
                    {revenueMetrics?.vendorRevenue?.length > 0 && (
                        <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">Top Vendors</h3>
                                    <p className="text-xs text-slate-500 font-medium mt-1">Highest revenue generators</p>
                                </div>
                                <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center">
                                    <Award className="w-5 h-5 text-emerald-500" />
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 bg-white">
                                            <th className="px-8 py-5">Rank</th>
                                            <th className="px-8 py-5">Vendor ID</th>
                                            <th className="px-8 py-5 text-right">Revenue</th>
                                            <th className="px-8 py-5 text-right">% of Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 bg-white">
                                        {revenueMetrics.vendorRevenue.map((v: any, i: number) => {
                                            const totalRev = revenueMetrics.vendorRevenue.reduce((s: number, item: any) => s + item.amount, 0);
                                            const pct = totalRev > 0 ? (Number((v.amount / totalRev) * 100) || 0).toFixed(1) : '0';
                                            const isTop3 = i < 3;
                                            return (
                                                <tr key={v.vendorId} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-8 py-4">
                                                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl text-sm font-black ${isTop3 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                                                            {i + 1}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-4">
                                                        <span className="text-sm font-bold text-slate-700 font-mono group-hover:text-emerald-600 transition-colors">{v.vendorId.slice(0, 12)}...</span>
                                                    </td>
                                                    <td className="px-8 py-4 text-right">
                                                        <span className="text-sm font-black text-slate-900">Rs. {v.amount.toLocaleString()}</span>
                                                    </td>
                                                    <td className="px-8 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-3">
                                                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                                                            </div>
                                                            <span className="text-xs font-bold text-slate-500 w-8">{pct}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Affiliate Management & Breakdown */}
                <div className="space-y-8">
                    
                    {/* Affiliate Quick Actions & Summary */}
                    <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-8">
                        <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-emerald-500" />
                            Payout Operations
                        </h3>
                        
                        <div className="space-y-4 mb-8">
                            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-between group hover:border-amber-300 transition-colors cursor-default">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-amber-500">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-700/70">Pending Review</p>
                                        <p className="text-lg font-black text-amber-900">Rs. {totalPending.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-between group hover:border-blue-300 transition-colors cursor-default">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-500">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-700/70">Approved (Unpaid)</p>
                                        <p className="text-lg font-black text-blue-900">Rs. {totalApproved.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Link
                            href="/admin/affiliates/payouts"
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
                        >
                            Process Payouts <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </Link>
                    </div>

                    {/* Revenue Breakdown */}
                    <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-8">
                        <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-indigo-500" />
                            Revenue Split
                        </h3>
                        <div className="space-y-6">
                            {[
                                { label: 'Subscriptions', amount: (stats as any)?.revenueBreakdown?.subscriptions || totalRevenue * 0.85, pct: (stats as any)?.revenueBreakdown?.subscriptionsPct || 85, color: 'bg-indigo-500' },
                                { label: 'Promotions & Events', amount: (stats as any)?.revenueBreakdown?.promotions || totalRevenue * 0.1, pct: (stats as any)?.revenueBreakdown?.promotionsPct || 10, color: 'bg-violet-500' },
                                { label: 'Other Sources', amount: (stats as any)?.revenueBreakdown?.other || totalRevenue * 0.05, pct: (stats as any)?.revenueBreakdown?.otherPct || 5, color: 'bg-slate-300' },
                            ].map((src, i) => (
                                <div key={i} className="group cursor-default">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-slate-500 flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${src.color}`} />
                                            {src.label}
                                        </span>
                                        <span className="text-sm font-black text-slate-900">Rs. {src.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                    </div>
                                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className={`h-full ${src.color} rounded-full transition-all duration-1000 origin-left scale-x-0 group-hover:opacity-80`} style={{ width: `${src.pct}%`, transform: 'scaleX(1)' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>

            {/* Recent Payments Table */}
            <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden mt-8">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-700">
                        <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900">Recent Transactions</h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">Latest affiliate payout requests</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 bg-white">
                                <th className="px-8 py-5">Affiliate Name</th>
                                <th className="px-8 py-5 text-right">Amount</th>
                                <th className="px-8 py-5">Method</th>
                                <th className="px-8 py-5 text-center">Status</th>
                                <th className="px-8 py-5 text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white">
                            {payments.slice(0, 10).map((p: any) => (
                                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600">
                                                {p.affiliate?.user?.fullName?.[0]?.toUpperCase() || 'A'}
                                            </div>
                                            <span className="text-sm font-bold text-slate-900">{p.affiliate?.user?.fullName || 'Unknown'}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        <span className="text-sm font-black text-slate-900">Rs. {(Number(p.amount) || 0).toLocaleString()}</span>
                                    </td>
                                    <td className="px-8 py-4">
                                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">{p.paymentMethod || p.method || 'Bank'}</span>
                                    </td>
                                    <td className="px-8 py-4 text-center">
                                        <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                            p.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                            p.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                                            p.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                                            'bg-amber-100 text-amber-700'
                                        }`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        <span className="text-xs font-bold text-slate-500">{formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}</span>
                                    </td>
                                </tr>
                            ))}
                            {payments.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-12 text-center text-slate-400 text-sm font-medium">
                                        No recent payments found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
