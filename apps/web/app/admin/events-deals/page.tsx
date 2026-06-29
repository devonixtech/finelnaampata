"use client";

import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import {
    Loader2,
    Search,
    Calendar,
    Tag,
    Receipt,
    Star,
    Trash2,
    Sparkles,
    Filter,
    X,
    CheckCircle2,
    Clock,
    DollarSign,
    ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminEventsDealsPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [deals, setDeals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Tab state
    const [activeTab, setActiveTab] = useState<'all' | 'events' | 'deals'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'featured'>('all');

    // Payment history modal
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [payments, setPayments] = useState<any[]>([]);
    const [paymentsLoading, setPaymentsLoading] = useState(false);
    const [paymentSearch, setPaymentSearch] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [eventsRes, dealsRes] = await Promise.all([
                api.events.adminGetAll(1, 100).catch(() => ({ data: [] })),
                api.deals.adminGetAll(1, 100).catch(() => ({ data: [] }))
            ]);
            setEvents(eventsRes?.data || eventsRes || []);
            setDeals(dealsRes?.data || dealsRes || []);
        } catch (err: any) {
            console.error('Failed to fetch events and deals:', err);
            setError(err.message || 'Failed to fetch items');
        } finally {
            setLoading(false);
        }
    };

    const fetchPaymentHistory = async () => {
        try {
            setPaymentsLoading(true);
            const response = await api.admin.getEventDealPayments();
            setPayments(Array.isArray(response) ? response : []);
        } catch (err: any) {
            console.error('Failed to fetch payment history:', err);
        } finally {
            setPaymentsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenPayments = () => {
        setIsPaymentModalOpen(true);
        fetchPaymentHistory();
    };

    const handleToggleFeatured = async (id: string, isEvent: boolean, currentFeatured: boolean) => {
        try {
            setActionLoading(`feat-${id}`);
            if (isEvent) {
                await api.events.adminToggleFeatured(id, !currentFeatured);
            } else {
                await api.deals.adminToggleFeatured(id, !currentFeatured);
            }
            await fetchData();
        } catch (err: any) {
            alert(err.message || 'Failed to update featured status');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id: string, isEvent: boolean, title: string) => {
        if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
        try {
            setActionLoading(`del-${id}`);
            if (isEvent) {
                await api.events.remove(id);
            } else {
                await api.deals.remove(id);
            }
            await fetchData();
        } catch (err: any) {
            alert(err.message || 'Failed to delete item');
        } finally {
            setActionLoading(null);
        }
    };

    // Combine and mark items
    const combinedItems = [
        ...events.map(e => ({ ...e, _itemType: 'event' as const })),
        ...deals.map(d => ({ ...d, _itemType: 'deal' as const }))
    ];

    const filteredItems = combinedItems.filter(item => {
        if (activeTab === 'events' && item._itemType !== 'event') return false;
        if (activeTab === 'deals' && item._itemType !== 'deal') return false;

        if (statusFilter === 'featured' && !item.isFeatured) return false;
        if (statusFilter === 'published' && !item.isPublished) return false;
        if (statusFilter === 'draft' && item.isPublished) return false;

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const titleMatch = (item.title || '').toLowerCase().includes(q);
            const vendorMatch = (item.vendor?.businessName || item.vendor?.user?.fullName || '').toLowerCase().includes(q);
            const descMatch = (item.description || '').toLowerCase().includes(q);
            return titleMatch || vendorMatch || descMatch;
        }

        return true;
    });

    const filteredPayments = payments.filter(p => {
        if (!paymentSearch.trim()) return true;
        const q = paymentSearch.toLowerCase();
        return (
            (p.itemName || '').toLowerCase().includes(q) ||
            (p.vendorName || '').toLowerCase().includes(q) ||
            (p.vendorEmail || '').toLowerCase().includes(q) ||
            (p.invoiceNumber || '').toLowerCase().includes(q) ||
            (p.type || '').toLowerCase().includes(q)
        );
    });

    const totalPaymentAmount = payments
        .filter(p => p.status === 'active' || p.status === 'completed' || p.status === 'succeeded' || p.amount > 0)
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    return (
        <div className="space-y-8 pb-16">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-black uppercase tracking-widest rounded-full flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" /> Superadmin Operations
                        </span>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Events & Deals Management</h1>
                    <p className="text-slate-500 font-bold mt-1 text-base">Monitor platform-wide promotional deals, event listings, and payment revenues.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleOpenPayments}
                        className="flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-500/20 hover:from-emerald-700 hover:to-teal-700 transition-all active:scale-95"
                    >
                        <Receipt className="w-5 h-5" />
                        Billing & Payment History
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 border border-red-100">
                    <X className="w-5 h-5 flex-shrink-0" />
                    <p className="font-bold text-sm">{error}</p>
                </div>
            )}

            {/* Filter & Controls Bar */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Tabs */}
                <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        All ({events.length + deals.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('events')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'events' ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        <Calendar className="w-3.5 h-3.5" /> Events ({events.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('deals')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'deals' ? 'bg-pink-600 text-white shadow-md shadow-pink-500/20' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        <Tag className="w-3.5 h-3.5" /> Deals ({deals.length})
                    </button>
                </div>

                {/* Search & Status Filter */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[240px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search title or business..."
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-500 transition-colors"
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5">
                        <Filter className="w-4 h-4 text-slate-400" />
                        <select
                            value={statusFilter}
                            onChange={(e: any) => setStatusFilter(e.target.value)}
                            className="bg-transparent text-xs font-black text-slate-700 focus:outline-none cursor-pointer"
                        >
                            <option value="all">All Status</option>
                            <option value="published">Published</option>
                            <option value="draft">Draft / Un-published</option>
                            <option value="featured">Featured Boosted</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/80 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Type & Title</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Vendor / Business</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Pricing & Discount</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Dates / Validity</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-3" />
                                        <p className="text-sm font-bold text-slate-400">Loading events and deals...</p>
                                    </td>
                                </tr>
                            ) : filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Calendar className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <p className="text-slate-900 font-black text-lg">No items matching your criteria</p>
                                        <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search query.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item) => {
                                    const isEvent = item._itemType === 'event';
                                    const vendorName = item.vendor?.businessName || item.vendor?.user?.fullName || 'N/A';
                                    const vendorEmail = item.vendor?.businessEmail || item.vendor?.user?.email || '';

                                    return (
                                        <tr key={`${item._itemType}-${item.id}`} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${isEvent ? 'bg-purple-100 text-purple-600' : 'bg-pink-100 text-pink-600'}`}>
                                                        {isEvent ? <Calendar className="w-5 h-5" /> : <Tag className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md ${isEvent ? 'bg-purple-100 text-purple-700' : 'bg-pink-100 text-pink-700'}`}>
                                                                {isEvent ? 'Event' : 'Deal'}
                                                            </span>
                                                            {item.isFeatured && (
                                                                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-amber-100 text-amber-700 flex items-center gap-1">
                                                                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Featured
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="font-black text-slate-900 text-sm mt-1 max-w-xs line-clamp-1">{item.title}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-black text-slate-900 text-sm">{vendorName}</p>
                                                    <p className="text-xs font-bold text-slate-400">{vendorEmail}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm">
                                                    {isEvent ? (
                                                        item.price ? (
                                                            <p className="font-black text-slate-900">PKR {Number(item.price).toLocaleString()}</p>
                                                        ) : (
                                                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-black rounded-lg">Free</span>
                                                        )
                                                    ) : (
                                                        <div>
                                                            <p className="font-black text-slate-900">PKR {Number(item.dealPrice || item.discountedPrice || item.price || 0).toLocaleString()}</p>
                                                            {item.originalPrice && (
                                                                <p className="text-xs text-slate-400 line-through">PKR {Number(item.originalPrice).toLocaleString()}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-bold text-slate-600">
                                                    {isEvent ? (
                                                        <>
                                                            <p>Date: {item.startDate ? new Date(item.startDate).toLocaleDateString() : 'N/A'}</p>
                                                            <p className="text-slate-400">Time: {item.startTime || 'All day'}</p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <p>Valid until: {item.endDate ? new Date(item.endDate).toLocaleDateString() : 'Ongoing'}</p>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg ${item.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    {item.isPublished ? 'Published' : 'Draft'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleToggleFeatured(item.id, isEvent, item.isFeatured)}
                                                        disabled={actionLoading === `feat-${item.id}`}
                                                        className={`p-2 rounded-xl transition-all ${item.isFeatured ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                                        title={item.isFeatured ? 'Remove Featured' : 'Make Featured'}
                                                    >
                                                        {actionLoading === `feat-${item.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className={`w-4 h-4 ${item.isFeatured ? 'fill-amber-500 text-amber-500' : ''}`} />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id, isEvent, item.title)}
                                                        disabled={actionLoading === `del-${item.id}`}
                                                        className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all disabled:opacity-50"
                                                        title="Delete Item"
                                                    >
                                                        {actionLoading === `del-${item.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payments History Modal */}
            <AnimatePresence>
                {isPaymentModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
                        >
                            {/* Modal Header */}
                            <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-widest rounded-full flex items-center gap-1">
                                            <DollarSign className="w-3.5 h-3.5" /> Financial Records
                                        </span>
                                    </div>
                                    <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-white">Event & Deal Payment History</h2>
                                    <p className="text-xs font-bold text-slate-400 mt-1">Transaction audit log for event visibility and deal promotions.</p>
                                </div>

                                <button
                                    onClick={() => setIsPaymentModalOpen(false)}
                                    className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Summary Cards Row */}
                            <div className="p-6 bg-slate-50 border-b border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-5 bg-white rounded-2xl border border-slate-200/60 flex items-center gap-4 shadow-sm">
                                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center font-black">
                                        <DollarSign className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Total Promotion Revenue</p>
                                        <p className="text-2xl font-black text-slate-900 mt-0.5">PKR {totalPaymentAmount.toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="p-5 bg-white rounded-2xl border border-slate-200/60 flex items-center gap-4 shadow-sm">
                                    <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center font-black">
                                        <Receipt className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Total Transactions</p>
                                        <p className="text-2xl font-black text-slate-900 mt-0.5">{payments.length} Records</p>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Search */}
                            <div className="p-6 border-b border-slate-100">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        value={paymentSearch}
                                        onChange={e => setPaymentSearch(e.target.value)}
                                        placeholder="Search by invoice #, item, vendor name, or email..."
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Modal Table Content */}
                            <div className="p-6 overflow-y-auto flex-1">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">Invoice / ID</th>
                                            <th className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">Type & Promotion</th>
                                            <th className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">Vendor</th>
                                            <th className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">Amount</th>
                                            <th className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">Gateway</th>
                                            <th className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
                                            <th className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {paymentsLoading ? (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-12 text-center">
                                                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
                                                    <p className="text-sm font-bold text-slate-400">Fetching transaction logs...</p>
                                                </td>
                                            </tr>
                                        ) : filteredPayments.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-12 text-center">
                                                    <p className="text-slate-900 font-black text-base">No payment history found</p>
                                                    <p className="text-xs text-slate-400 mt-1">Transactions will appear when vendors boost events or deals.</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredPayments.map((pay) => (
                                                <tr key={pay.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <span className="font-mono text-xs font-black text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                                                            {pay.invoiceNumber || pay.id.slice(0, 8)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div>
                                                            <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md ${pay.type === 'Event' ? 'bg-purple-100 text-purple-700' : 'bg-pink-100 text-pink-700'}`}>
                                                                {pay.type}
                                                            </span>
                                                            <p className="font-black text-slate-900 text-xs mt-1">{pay.itemName}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div>
                                                            <p className="font-black text-slate-900 text-xs">{pay.vendorName}</p>
                                                            <p className="text-[11px] font-bold text-slate-400">{pay.vendorEmail}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="font-black text-slate-900 text-xs">
                                                            PKR {Number(pay.amount || 0).toLocaleString()}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-xs font-bold text-slate-500">
                                                            {pay.paymentGateway}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg ${
                                                            pay.status === 'active' || pay.status === 'completed' || pay.status === 'succeeded'
                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                            {pay.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs font-bold text-slate-500 whitespace-nowrap">
                                                        {pay.createdAt ? new Date(pay.createdAt).toLocaleDateString() : 'N/A'}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                                <button
                                    onClick={() => setIsPaymentModalOpen(false)}
                                    className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-xs hover:bg-slate-800 transition-all active:scale-95"
                                >
                                    Close Window
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
