"use client";

import React, { useState, useEffect } from 'react';
import { api, getImageUrl } from '../../../lib/api';
import toast from 'react-hot-toast';
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
    ExternalLink,
    Eye,
    SlidersHorizontal,
    MapPin,
    Building2,
    Mail,
    Phone,
    Info,
    Percent,
    Layers,
    Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';

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

    // Item Details Modal
    const [selectedItem, setSelectedItem] = useState<any | null>(null);

    // State
    const [items, setItems] = useState<any[]>([]);

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
            console.error('Failed to fetch events and offers:', err);
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
            toast.error(err.message || 'Failed to update featured status');
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
            toast.error(err.message || 'Failed to delete item');
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
        if (statusFilter === 'published' && !item.isActive) return false;
        if (statusFilter === 'draft' && item.isActive) return false;

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const titleMatch = (item.title || '').toLowerCase().includes(q);
            const vendorMatch = (item.vendor?.businessName || item.vendor?.user?.fullName || '').toLowerCase().includes(q);
            const descMatch = (item.description || '').toLowerCase().includes(q);
            return titleMatch || vendorMatch || descMatch;
        }

        return true;
    });

    const filteredPayments = payments.filter(pay => {
        if (!paymentSearch.trim()) return true;
        const q = paymentSearch.toLowerCase();
        const invoiceMatch = (pay.invoiceNumber || pay.id || '').toLowerCase().includes(q);
        const vendorMatch = (pay.vendorName || pay.vendorEmail || '').toLowerCase().includes(q);
        const itemMatch = (pay.itemName || '').toLowerCase().includes(q);
        const typeMatch = (pay.type || '').toLowerCase().includes(q);
        return invoiceMatch || vendorMatch || itemMatch || typeMatch;
    });

    const totalPaymentAmount = filteredPayments.reduce((acc, pay) => acc + (Number(pay.amount) || 0), 0);

    return (
        <div className="space-y-8 pb-16">
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-black uppercase tracking-widest rounded-full flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" /> Superadmin Operations
                        </span>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Events & Offers Management</h1>
                    <p className="text-slate-500 font-bold mt-1 text-base">Monitor platform-wide promotional offers, event listings, and payment logs.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={handleOpenPayments}
                        className="flex items-center justify-center gap-2.5 px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-black text-xs shadow-xl shadow-emerald-500/20 hover:from-emerald-700 hover:to-teal-700 transition-all active:scale-95"
                    >
                        <Receipt className="w-4 h-4" />
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
                        <Tag className="w-3.5 h-3.5" /> Offers ({deals.length})
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

                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 overflow-visible min-w-[200px]">
                        <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div className="flex-1">
                            <SearchableSelect
                                value={statusFilter}
                                onChange={(val: any) => setStatusFilter(val)}
                                options={[
                                    { label: "All Status", value: "all" },
                                    { label: "Published", value: "published" },
                                    { label: "Draft / Un-published", value: "draft" },
                                    { label: "Featured Boosted", value: "featured" }
                                ]}
                            />
                        </div>
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
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Ticket / Deal Price</th>
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
                                        <p className="text-sm font-bold text-slate-400">Loading events and offers...</p>
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
                                        <tr key={`${item._itemType}-${item.id}`} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => setSelectedItem(item)}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${isEvent ? 'bg-purple-100 text-purple-600' : 'bg-pink-100 text-pink-600'}`}>
                                                        {isEvent ? <Calendar className="w-5 h-5" /> : <Tag className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md ${isEvent ? 'bg-purple-100 text-purple-700' : 'bg-pink-100 text-pink-700'}`}>
                                                                {isEvent ? 'Event' : 'Offer'}
                                                            </span>
                                                            {item.isFeatured && (
                                                                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-amber-100 text-amber-700 flex items-center gap-1">
                                                                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Featured
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="font-black text-slate-900 text-sm mt-1 max-w-xs line-clamp-1 group-hover:text-purple-600 transition-colors">{item.title}</p>
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
                                                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-black rounded-lg">Free Entry</span>
                                                        )
                                                    ) : (
                                                        <div>
                                                            {item.offerBadge ? (
                                                                <span className="px-2.5 py-1 bg-pink-100 text-pink-700 text-xs font-black rounded-lg whitespace-nowrap">
                                                                    {item.offerBadge}
                                                                </span>
                                                            ) : (
                                                                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-black rounded-lg whitespace-nowrap">
                                                                    Special Offer
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-bold text-slate-600">
                                                    {isEvent ? (
                                                        <>
                                                            <p>Start: {item.startDate ? new Date(item.startDate).toLocaleDateString() : 'N/A'}</p>
                                                            <p>End: {item.endDate ? new Date(item.endDate).toLocaleDateString() : 'Ongoing'}</p>
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
                                                <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg ${item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    {item.isActive ? 'Published' : 'Draft'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setSelectedItem(item)}
                                                        className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
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

            {/* View Item Details Modal */}
            <AnimatePresence>
                {selectedItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] border border-slate-100"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${selectedItem._itemType === 'event' ? 'bg-purple-500/20 text-purple-300' : 'bg-pink-500/20 text-pink-300'}`}>
                                        {selectedItem._itemType === 'event' ? <Calendar className="w-5 h-5" /> : <Tag className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md ${selectedItem._itemType === 'event' ? 'bg-purple-500/20 text-purple-300' : 'bg-pink-500/20 text-pink-300'}`}>
                                                {selectedItem._itemType === 'event' ? 'Event Details' : 'Offer Details'}
                                            </span>
                                            {selectedItem.isFeatured && (
                                                <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-amber-500/20 text-amber-300 flex items-center gap-1">
                                                    <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" /> Featured
                                                </span>
                                            )}
                                        </div>
                                        <h2 className="text-xl font-black text-white mt-1 max-w-md truncate">{selectedItem.title}</h2>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedItem(null)}
                                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Scrollable Body */}
                            <div className="p-6 overflow-y-auto space-y-6 flex-1">
                                {/* Banner / Image Preview if any */}
                                {(selectedItem.bannerUrl || selectedItem.imageUrl || selectedItem.coverImageUrl) && (
                                    <div className="w-full h-48 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                                        <img
                                            src={getImageUrl(selectedItem.bannerUrl || selectedItem.imageUrl || selectedItem.coverImageUrl) || ''}
                                            alt={selectedItem.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}

                                {/* Key Highlights Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Price / Cost</p>
                                        <p className="text-base font-black text-slate-900 mt-0.5">
                                            {selectedItem._itemType === 'event'
                                                ? (selectedItem.price ? `PKR ${Number(selectedItem.price).toLocaleString()}` : 'Free Entry')
                                                : (selectedItem.offerBadge || 'Special Offer')
                                            }
                                        </p>
                                    </div>

                                    {selectedItem.originalPrice && selectedItem._itemType === 'deal' && (
                                        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Original Price</p>
                                            <p className="text-base font-black text-slate-400 line-through mt-0.5">
                                                PKR {Number(selectedItem.originalPrice).toLocaleString()}
                                            </p>
                                        </div>
                                    )}

                                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Publication Status</p>
                                        <p className={`text-sm font-black mt-0.5 ${selectedItem.isActive ? 'text-emerald-600' : 'text-slate-500'}`}>
                                            {selectedItem.isActive ? 'Published Live' : 'Draft / Inactive'}
                                        </p>
                                    </div>

                                    {selectedItem.placements && selectedItem.placements.length > 0 && (
                                        <div className="bg-amber-50/50 rounded-2xl p-3 border border-amber-100/50 sm:col-span-3">
                                            <p className="text-[10px] font-black text-amber-500/80 uppercase tracking-wider">Active Promotions</p>
                                            <div className="flex flex-wrap gap-2 mt-1.5">
                                                {selectedItem.placements.map((p: string) => (
                                                    <span key={p} className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5">
                                                        <Star className="w-3 h-3 fill-amber-500" />
                                                        {p.replace(/_/g, ' ')}
                                                    </span>
                                                ))}
                                            </div>
                                            {selectedItem.featuredUntil && (
                                                <p className="text-[10px] font-bold text-amber-600/70 mt-1.5">
                                                    Expires: {new Date(selectedItem.featuredUntil).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Vendor Information */}
                                <div className="bg-purple-50/50 rounded-2xl p-4 border border-purple-100/60 space-y-2">
                                    <p className="text-[10px] font-black text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Building2 className="w-3.5 h-3.5" /> Vendor & Business Profile
                                    </p>
                                    <p className="text-base font-black text-slate-900">{selectedItem.vendor?.businessName || selectedItem.vendor?.user?.fullName || 'N/A'}</p>
                                    <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                                        <Mail className="w-3.5 h-3.5 text-slate-400" /> {selectedItem.vendor?.businessEmail || selectedItem.vendor?.user?.email || 'No Email'}
                                    </p>
                                </div>

                                {/* Dates & Venue */}
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Schedule & Validity</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold text-slate-700">
                                        {selectedItem._itemType === 'event' ? (
                                            <>
                                                <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl">
                                                    <Calendar className="w-4 h-4 text-purple-600" />
                                                    <span>Start: {selectedItem.startDate ? new Date(selectedItem.startDate).toLocaleDateString() : 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl">
                                                    <Clock className="w-4 h-4 text-purple-600" />
                                                    <span>Time: {selectedItem.startTime || 'All day'}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl col-span-2">
                                                <Calendar className="w-4 h-4 text-pink-600" />
                                                <span>Valid Until: {selectedItem.endDate ? new Date(selectedItem.endDate).toLocaleDateString() : 'Ongoing'}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Description & Terms</p>
                                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-slate-700 text-xs font-medium leading-relaxed whitespace-pre-line">
                                        {selectedItem.description || 'No detailed description provided for this item.'}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                                <button
                                    onClick={() => handleToggleFeatured(selectedItem.id, selectedItem._itemType === 'event', selectedItem.isFeatured)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${selectedItem.isFeatured ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                                >
                                    <Star className={`w-4 h-4 ${selectedItem.isFeatured ? 'fill-amber-500 text-amber-500' : ''}`} />
                                    {selectedItem.isFeatured ? 'Remove Featured' : 'Mark Featured'}
                                </button>
                                <button
                                    onClick={() => setSelectedItem(null)}
                                    className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-xs hover:bg-slate-800 transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Payments History Modal */}
            <AnimatePresence>
                {isPaymentModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[2rem] w-[95vw] max-w-5xl shadow-2xl flex flex-col overflow-hidden max-h-[95vh] my-auto"
                        >
                            {/* Modal Header */}
                            <div className="p-5 md:p-6 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between shrink-0 rounded-t-[2rem]">
                                <div>
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1">
                                            <DollarSign className="w-3 h-3" /> Financial Records
                                        </span>
                                    </div>
                                    <h2 className="text-xl lg:text-2xl font-black tracking-tight text-white">Event & Offer Payment History</h2>
                                </div>

                                <button
                                    onClick={() => setIsPaymentModalOpen(false)}
                                    className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Summary Cards Row */}
                            <div className="p-4 bg-slate-50 border-b border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3 shrink-0">
                                <div className="p-4 bg-white rounded-xl border border-slate-200/60 flex items-center gap-4 shadow-sm">
                                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center font-black shrink-0">
                                        <DollarSign className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Revenue</p>
                                        <p className="text-lg lg:text-xl font-black text-slate-900 leading-tight">PKR {totalPaymentAmount.toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-white rounded-xl border border-slate-200/60 flex items-center gap-4 shadow-sm">
                                    <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center font-black shrink-0">
                                        <Receipt className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Transactions</p>
                                        <p className="text-lg lg:text-xl font-black text-slate-900 leading-tight">{payments.length} Records</p>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Search */}
                            <div className="p-4 border-b border-slate-100 shrink-0">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        value={paymentSearch}
                                        onChange={e => setPaymentSearch(e.target.value)}
                                        placeholder="Search by invoice #, item, vendor name, or email..."
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Modal Table Content */}
                            <div className="overflow-auto flex-1 min-h-[300px]">
                                <table className="w-full text-left border-collapse min-w-[700px]">
                                    <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider bg-slate-50">Invoice / ID</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider bg-slate-50">Type & Promotion</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider bg-slate-50">Vendor</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider bg-slate-50">Amount</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider bg-slate-50">Gateway</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider bg-slate-50">Status</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider bg-slate-50">Date</th>
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
                                                    <p className="text-xs text-slate-400 mt-1">Transactions will appear when vendors boost events or offers.</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredPayments.map((pay) => (
                                                <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="px-4 py-2.5">
                                                        <span className="font-mono text-xs font-black text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                                                            {pay.invoiceNumber || pay.id.slice(0, 8)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <div>
                                                            <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md ${pay.type === 'Event' ? 'bg-purple-100 text-purple-700' : 'bg-pink-100 text-pink-700'}`}>
                                                                {pay.type === 'Deal' ? 'Offer' : pay.type}
                                                            </span>
                                                            <p className="font-black text-slate-900 text-xs mt-1 max-w-[150px] truncate" title={pay.itemName}>{pay.itemName}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <div>
                                                            <p className="font-black text-slate-900 text-xs max-w-[150px] truncate" title={pay.vendorName}>{pay.vendorName}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 max-w-[150px] truncate" title={pay.vendorEmail}>{pay.vendorEmail}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <span className="font-black text-slate-900 text-xs whitespace-nowrap">
                                                            PKR {Number(pay.amount || 0).toLocaleString()}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <span className="text-xs font-bold text-slate-500">
                                                            {pay.paymentGateway}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg ${
                                                            pay.status === 'active' || pay.status === 'completed' || pay.status === 'succeeded'
                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                            {pay.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-[11px] font-bold text-slate-500 whitespace-nowrap">
                                                        {pay.createdAt ? new Date(pay.createdAt).toLocaleDateString() : 'N/A'}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
                                <button
                                    onClick={() => setIsPaymentModalOpen(false)}
                                    className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-xs hover:bg-slate-800 transition-all active:scale-95"
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
