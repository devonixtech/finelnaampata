"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    CheckCircle2, Clock, XCircle, Loader2, Store,
    MapPin, Phone, RefreshCw, ShieldCheck, ExternalLink,
    AlertCircle, MessageSquare, ChevronLeft, ChevronRight,
    Search, Filter, Calendar, Mail, User as UserIcon
} from 'lucide-react';
import { api, getImageUrl } from '../../../lib/api';
import { ListingImage } from '../../../components/ListingImage';
import { motion, AnimatePresence } from 'framer-motion';

type Status = 'pending' | 'approved' | 'rejected' | 'suspended';

const StatusPill = ({ status }: { status: Status }) => {
    const map: Record<Status, { label: string; cls: string; Icon: any }> = {
        pending: { label: 'Pending Review', cls: 'bg-amber-50 text-amber-700 border-amber-200', Icon: Clock },
        approved: { label: 'Approved', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle2 },
        rejected: { label: 'Rejected', cls: 'bg-red-50 text-red-600 border-red-200', Icon: XCircle },
        suspended: { label: 'Suspended', cls: 'bg-slate-100 text-slate-500 border-slate-200', Icon: AlertCircle },
    };
    const s = map[status] || map.pending;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${s.cls}`}>
            <s.Icon className="w-3.5 h-3.5" /> {s.label}
        </span>
    );
};

export default function AdminListingsPage() {
    const [listings, setListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | Status>('pending');
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState<any>({ total: 0, totalPages: 1 });
    const [rejectionModal, setRejectionModal] = useState<{ id: string; title: string } | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [keywordsModal, setKeywordsModal] = useState<{ id: string; title: string; keywords: string[]; limit: number } | null>(null);
    const [newKeyword, setNewKeyword] = useState('');
    const LIMIT = 10;

    const fetchListings = useCallback(async (p = page, f = filter) => {
        setLoading(true);
        try {
            // Using the more robust admin API
            const res = await api.admin.getBusinesses(p, LIMIT, f === 'all' ? undefined : f);
            setListings(res.data || []);
            setMeta(res.meta || { total: 0, totalPages: 1 });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [page, filter]);

    useEffect(() => { fetchListings(); }, [fetchListings]);
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [page]);

    const moderate = async (id: string, action: 'approved' | 'rejected', reason?: string) => {
        setActionLoading(id + action);
        try {
            await api.admin.moderateBusiness(id, action, reason);
            setListings(prev => prev.filter(l => l.id !== id));
            setMeta((m: any) => ({ ...m, total: m.total - 1 }));
            if (action === 'rejected') {
                setRejectionModal(null);
                setRejectionReason('');
            }
        } catch (err: any) {
            alert(err.message || 'Action failed');
        } finally {
            setActionLoading(null);
        }
    };

    const updateKeywords = async (id: string, keywords: string[]) => {
        setActionLoading(id + 'keywords');
        try {
            await api.admin.updateSearchKeywords(id, keywords);
            setListings(prev => prev.map(l => l.id === id ? { ...l, searchKeywords: keywords } : l));
            setKeywordsModal(null);
            setNewKeyword('');
        } catch (err: any) {
            alert(err.message || 'Action failed');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="space-y-8 pb-20 min-w-0 overflow-x-hidden ">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Review Queue</h1>
                    <p className="text-slate-400 font-medium mt-1">
                        {meta.total} listings awaiting your review and validation.
                    </p>
                </div>
                <button
                    onClick={() => fetchListings()}
                    className="flex items-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 rounded-2xl font-bold text-slate-600 transition-all active:scale-95"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {(['pending', 'approved', 'rejected', 'all'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => { setFilter(tab); setPage(1); }}
                        className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl font-black text-sm transition-all border whitespace-nowrap ${filter === tab
                            ? 'bg-slate-900 text-white border-slate-900  shadow-slate-900/20'
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'
                            }`}
                    >
                        <span className="capitalize">{tab}</span>
                        {filter === tab && (
                            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] text-white">
                                {meta.total}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Listings Queue */}
            {loading && listings.length === 0 ? (
                <div className="flex items-center justify-center py-32">
                    <Loader2 className="w-10 h-10 animate-spin text-slate-300" />
                </div>
            ) : listings.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-[28px] p-24 flex flex-col items-center text-center border-2 border-dashed border-slate-100"
                >
                    <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
                        <ShieldCheck className="w-12 h-12 text-emerald-500" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900">All Clear!</h3>
                    <p className="text-slate-400 font-medium mt-2 max-w-xs">No pending listings to review at this time. Great job!</p>
                </motion.div>
            ) : (
                <div className="grid gap-6">
                    <AnimatePresence mode='popLayout'>
                        {listings.map((listing, idx) => (
                            <motion.div
                                key={listing.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-white rounded-[28px] border border-slate-100  shadow-slate-200/40 overflow-hidden group hover:border-blue-200 transition-all duration-500"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center gap-8 p-8">
                                    {/* Visual Group */}
                                    <div className="flex items-center gap-6">
                                        <div className="w-24 h-24 rounded-3xl overflow-hidden flex-shrink-0 bg-slate-100 shadow-inner group-hover:scale-105 transition-transform duration-500">
                                            <ListingImage
                                                src={listing.coverImageUrl}
                                                alt={listing.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <StatusPill status={listing.status} />
                                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                                <Calendar className="w-3 h-3" />
                                                Submitted {new Date(listing.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Main Info */}
                                    <div className="flex-1 min-w-0" style={{ width: "100px" }}>
                                        <h3 className="text-2xl font-black text-slate-900 mb-2 truncate group-hover:text-blue-600 transition-colors">{listing.title}</h3>
                                        <div className="flex flex-wrap gap-y-2 gap-x-5 text-sm">
                                            <span className="flex items-center gap-1.5 text-slate-600 font-bold">
                                                <MapPin className="w-4 h-4 text-blue-500" />
                                                {listing.city}, {listing.state}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-slate-600 font-bold">
                                                <span className="text-slate-400 font-medium">Owner:</span> {listing.vendor?.user?.fullName || (listing.vendor as any)?.vendor_user?.fullName || listing.vendor?.businessName || 'Anonymous Owner'}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-slate-600 font-bold">
                                                <Mail className="w-4 h-4 text-slate-400" />
                                                {listing.vendor?.businessEmail || 'No Email'}
                                            </span>
                                        </div>
                                        <p className="text-slate-400 text-sm mt-4 line-clamp-2 leading-relaxed italic">
                                            {listing.description || 'No description provided by the business.'}
                                        </p>

                                        {/* Search Keywords Tags */}
                                        {listing.searchKeywords && listing.searchKeywords.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-4">
                                                {listing.searchKeywords.slice(0, 8).map((kw: string, i: number) => (
                                                    <span key={i} className="px-2.5 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-wider border border-slate-100 flex items-center gap-1.5">
                                                        <Search className="w-2.5 h-2.5 opacity-50" />
                                                        {kw}
                                                    </span>
                                                ))}
                                                {listing.searchKeywords.length > 8 && (
                                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest self-center ml-1">
                                                        +{listing.searchKeywords.length - 8} more
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-row lg:flex-col gap-3 flex-shrink-0">
                                        <button
                                            onClick={() => moderate(listing.id, 'approved')}
                                            disabled={!!actionLoading}
                                            className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[20px] font-black text-sm transition-all disabled:opacity-50  shadow-emerald-500/30 active:scale-95"
                                        >
                                            <CheckCircle2 className="w-5 h-5" /> Approve
                                        </button>
                                        <div className="flex gap-2 flex-1 lg:flex-none">
                                            <button
                                                onClick={() => setRejectionModal({ id: listing.id, title: listing.title })}
                                                disabled={!!actionLoading}
                                                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white hover:bg-red-50 text-red-600 border border-red-100 rounded-[20px] font-black text-sm transition-all active:scale-95"
                                            >
                                                <XCircle className="w-5 h-5" /> Reject
                                            </button>
                                            {/* <button
                                                onClick={() => {
                                                    // Get the vendor's subscription plan limit, fallback to 15 for free/pending vendors
                                                    // For Admins, we should always allow at least 15 for moderation purposes
                                                    const activeSub = listing.vendor?.subscriptions?.find((s: any) => s.status === 'active');
                                                    const planLimit = activeSub?.plan?.dashboardFeatures?.maxKeywords || 0;
                                                    const limit = Math.max(planLimit, 15);

                                                    setKeywordsModal({
                                                        id: listing.id,
                                                        title: listing.title,
                                                        keywords: listing.searchKeywords || [],
                                                        limit
                                                    });
                                                }}
                                                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-[20px] font-black text-sm transition-all active:scale-95"
                                                title="Manage Search Keywords"
                                            >
                                                <Search className="w-5 h-5" /> Keywords
                                            </button> */}
                                            <button
                                                onClick={() => window.open(`/business/${listing.slug}`, '_blank')}
                                                className="p-4 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-[20px] border border-slate-100 transition-all active:scale-95"
                                                title="Preview Listing"
                                            >
                                                <ExternalLink className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Pagination */}
            {meta.totalPages > 1 && (
                <div className="flex items-center justify-between pt-8">
                    <p className="text-xs text-slate-400 font-black uppercase tracking-widest">
                        Showing <span className="text-slate-900">{listings.length}</span> of <span className="text-slate-900">{meta.total}</span> Listings
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="p-3 rounded-2xl border border-slate-200 bg-white text-slate-600 hover:border-slate-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm shadow-slate-200 active:scale-95"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            disabled={page === meta.totalPages}
                            onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                            className="p-3 rounded-2xl border border-slate-200 bg-white text-slate-600 hover:border-slate-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm shadow-slate-200 active:scale-95"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Rejection Modal */}
            <AnimatePresence>
                {rejectionModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-[1rem] p-10 max-w-md w-full shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-red-500" />
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center">
                                    <AlertCircle className="w-8 h-8 text-red-500" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-xl font-black text-slate-900 truncate">Reject Listing</h3>
                                    <p className="text-slate-400 font-medium text-sm truncate">{rejectionModal.title}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Rejection Reason</label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Explain why this listing is being rejected (sent to business)..."
                                    className="w-full h-32 px-5 py-4 rounded-[2rem] border border-slate-100 bg-slate-50 text-slate-900 font-medium focus:outline-none focus:ring-4 focus:ring-red-50 placeholder:text-slate-300 text-sm resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-8">
                                <button
                                    onClick={() => setRejectionModal(null)}
                                    className="px-6 py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-[20px] font-black text-sm transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => moderate(rejectionModal.id, 'rejected', rejectionReason)}
                                    disabled={!rejectionReason || !!actionLoading}
                                    className="px-6 py-4 bg-red-500 hover:bg-red-600 text-white rounded-[20px] font-black text-sm  shadow-red-500/30 transition-all disabled:opacity-50"
                                >
                                    {actionLoading?.includes('rejected') ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Confirm Rejection'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Keywords Modal */}
                {keywordsModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-[2rem] p-10 max-w-lg w-full shadow-2xl relative overflow-hidden"
                        >
                            {/* <div className="absolute top-0 left-0 w-full h-2 bg-indigo-500" /> */}
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center">
                                    <Search className="w-8 h-8 text-indigo-500" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-xl font-black text-slate-900 truncate">Search Keywords</h3>
                                    <p className="text-slate-400 font-medium text-sm truncate">Limit: {keywordsModal.keywords.length} / {keywordsModal.limit}</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newKeyword}
                                        onChange={(e) => setNewKeyword(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && newKeyword.trim() && keywordsModal.keywords.length < keywordsModal.limit) {
                                                const kw = newKeyword.trim();
                                                if (!keywordsModal.keywords.includes(kw)) {
                                                    setKeywordsModal({ ...keywordsModal, keywords: [...keywordsModal.keywords, kw] });
                                                }
                                                setNewKeyword('');
                                            }
                                        }}
                                        disabled={keywordsModal.keywords.length >= keywordsModal.limit}
                                        placeholder={keywordsModal.keywords.length >= keywordsModal.limit ? "Limit reached" : "Add keyword and press Enter..."}
                                        className="flex-1 px-5 py-3.5 rounded-2xl border border-slate-100 bg-slate-50 text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-indigo-50 placeholder:text-slate-300 text-sm"
                                    />
                                    <button
                                        onClick={() => {
                                            if (newKeyword.trim() && keywordsModal.keywords.length < keywordsModal.limit) {
                                                const kw = newKeyword.trim();
                                                if (!keywordsModal.keywords.includes(kw)) {
                                                    setKeywordsModal({ ...keywordsModal, keywords: [...keywordsModal.keywords, kw] });
                                                }
                                                setNewKeyword('');
                                            }
                                        }}
                                        disabled={!newKeyword.trim() || keywordsModal.keywords.length >= keywordsModal.limit}
                                        className="p-3.5 bg-indigo-500 text-white rounded-2xl disabled:opacity-50"
                                    >
                                        <CheckCircle2 className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1 rounded-xl">
                                    {keywordsModal.keywords.map((kw, i) => (
                                        <span key={i} className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-bold text-xs">
                                            {kw}
                                            <XCircle
                                                className="w-4 h-4 text-slate-400 hover:text-red-500 cursor-pointer"
                                                onClick={() => setKeywordsModal({ ...keywordsModal, keywords: keywordsModal.keywords.filter(k => k !== kw) })}
                                            />
                                        </span>
                                    ))}
                                    {keywordsModal.keywords.length === 0 && (
                                        <p className="text-slate-300 text-sm italic font-medium w-full text-center py-4">No keywords assigned yet.</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-10">
                                <button
                                    onClick={() => { setKeywordsModal(null); setNewKeyword(''); }}
                                    className="px-6 py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-[20px] font-black text-sm transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => updateKeywords(keywordsModal.id, keywordsModal.keywords)}
                                    disabled={!!actionLoading}
                                    className="px-6 py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-[20px] font-black text-sm shadow-indigo-500/30 transition-all disabled:opacity-50"
                                >
                                    {actionLoading?.includes('keywords') ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Save Keywords'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
