"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    Users,
    Eye,
    Phone,
    TrendingUp,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Search,
    Loader2,
    BarChart3,
    ArrowUpRight,
} from 'lucide-react';
import { api } from '../../../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminVendorAnalyticsPage() {
    const [vendors, setVendors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedVendor, setSelectedVendor] = useState<any>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.admin.getVendorAnalytics();
            setVendors(data || []);
        } catch (err) {
            console.error('Failed to fetch vendor analytics:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filtered = vendors.filter(v =>
        !search || v.vendorName?.toLowerCase().includes(search.toLowerCase()) ||
        v.businessName?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-20">
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <Link href="/admin/analytics" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors mb-3">
                        <ChevronLeft className="w-3 h-3" /> Back to Analytics
                    </Link>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-1">
                        Vendor <span className="text-blue-600">Analytics</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-sm">
                        Per-vendor performance overview — views, leads, conversions, and subscription status.
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50 self-start"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </button>
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search vendors..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-slate-300 placeholder:text-slate-400 text-sm shadow-sm"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Vendors', value: vendors.length, color: 'bg-blue-100', textColor: 'text-blue-600' },
                    { label: 'Total Views', value: vendors.reduce((s, v) => s + (v.totalViews || 0), 0).toLocaleString(), color: 'bg-emerald-100', textColor: 'text-emerald-600' },
                    { label: 'Total Leads', value: vendors.reduce((s, v) => s + (v.totalLeads || 0), 0).toLocaleString(), color: 'bg-orange-100', textColor: 'text-orange-600' },
                    { label: 'Avg Conversion', value: vendors.length > 0 ? (vendors.reduce((s, v) => s + parseFloat(v.conversionRate || '0'), 0) / vendors.length).toFixed(1) + '%' : '0%', color: 'bg-violet-100', textColor: 'text-violet-600' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm">
                        <div className={`w-11 h-11 ${stat.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                            <BarChart3 className={`w-5 h-5 ${stat.textColor}`} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900 leading-none">{stat.value}</p>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                                <th className="px-6 py-4">Vendor</th>
                                <th className="px-6 py-4 text-right">Businesses</th>
                                <th className="px-6 py-4 text-right">Views</th>
                                <th className="px-6 py-4 text-right">Leads</th>
                                <th className="px-6 py-4 text-right">Conv. Rate</th>
                                <th className="px-6 py-4 text-right">Avg Response</th>
                                <th className="px-6 py-4">Subscription</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={7} className="px-6 py-5 h-14 bg-slate-50/20" />
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400 font-medium">
                                        No vendors found.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((v, i) => (
                                    <motion.tr
                                        key={v.vendorId}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="hover:bg-slate-50/30 transition-all cursor-pointer"
                                        onClick={() => setSelectedVendor(v)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-900">{v.vendorName}</span>
                                                <span className="text-[11px] text-slate-400 font-medium">{v.businessName || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-black text-slate-900">{v.businessCount}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-black text-slate-900">{(v.totalViews || 0).toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-black text-slate-900">{(v.totalLeads || 0).toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-black text-slate-900">{v.conversionRate}%</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-black text-slate-900">
                                                {v.avgResponseTime > 0 ? `${v.avgResponseTime}m` : 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wide border ${
                                                v.subscriptionStatus === 'active'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                    : 'bg-slate-50 text-slate-500 border-slate-100'
                                            }`}>
                                                {v.subscriptionPlan || 'Free'}
                                            </span>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AnimatePresence>
                {selectedVendor && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedVendor(null)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-white rounded-[20px] shadow-2xl border border-slate-100 p-8"
                        >
                            <h2 className="text-2xl font-black text-slate-900 mb-1">{selectedVendor.vendorName}</h2>
                            <p className="text-sm text-slate-400 font-medium mb-6">{selectedVendor.businessName || 'N/A'}</p>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-blue-50 rounded-2xl p-4 text-center">
                                    <Eye className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                                    <p className="text-2xl font-black text-blue-700">{(selectedVendor.totalViews || 0).toLocaleString()}</p>
                                    <p className="text-[10px] font-bold text-blue-400 uppercase">Views</p>
                                </div>
                                <div className="bg-orange-50 rounded-2xl p-4 text-center">
                                    <Phone className="w-5 h-5 text-orange-500 mx-auto mb-2" />
                                    <p className="text-2xl font-black text-orange-700">{(selectedVendor.totalLeads || 0).toLocaleString()}</p>
                                    <p className="text-[10px] font-bold text-orange-400 uppercase">Leads</p>
                                </div>
                                <div className="bg-emerald-50 rounded-2xl p-4 text-center">
                                    <TrendingUp className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
                                    <p className="text-2xl font-black text-emerald-700">{selectedVendor.conversionRate}%</p>
                                    <p className="text-[10px] font-bold text-emerald-400 uppercase">Conversion</p>
                                </div>
                                <div className="bg-violet-50 rounded-2xl p-4 text-center">
                                    <Users className="w-5 h-5 text-violet-500 mx-auto mb-2" />
                                    <p className="text-2xl font-black text-violet-700">{selectedVendor.businessCount}</p>
                                    <p className="text-[10px] font-bold text-violet-400 uppercase">Businesses</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedVendor(null)}
                                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                            >
                                Close
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
