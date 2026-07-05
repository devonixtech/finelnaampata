"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    CheckCircle2,
    Clock,
    XCircle,
    Loader2,
    MapPin,
    RefreshCw,
    ShieldCheck,
    ExternalLink,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Mail,
} from 'lucide-react';
import { api } from '../../../lib/api';
import { ListingImage } from '../../../components/ListingImage';
import { motion, AnimatePresence } from 'framer-motion';

type ListingStatus = 'pending_geocode' | 'approved' | 'rejected' | 'suspended';
type ListingFilter = 'processing' | 'approved' | 'rejected' | 'all';

const StatusPill = ({ status }: { status: string }) => {
    const map: Record<string, { label: string; cls: string; Icon: any }> = {
        pending_geocode: { label: 'Map Processing', cls: 'bg-amber-50 text-amber-700 border-amber-200', Icon: Clock },
        approved: { label: 'Approved', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle2 },
        rejected: { label: 'Rejected', cls: 'bg-red-50 text-red-600 border-red-200', Icon: XCircle },
        suspended: { label: 'Suspended', cls: 'bg-slate-100 text-slate-500 border-slate-200', Icon: AlertCircle },
    };
    const resolved = map[status] || map.pending_geocode;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${resolved.cls}`}>
            <resolved.Icon className="w-3.5 h-3.5" /> {resolved.label}
        </span>
    );
};

function mapFilterToStatus(filter: ListingFilter): string | undefined {
    if (filter === 'processing') return 'pending_geocode';
    if (filter === 'all') return undefined;
    return filter;
}

export default function AdminListingsPage() {
    const [listings, setListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<ListingFilter>('processing');
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState<any>({ total: 0, totalPages: 1 });
    const LIMIT = 10;

    const fetchListings = useCallback(async (nextPage = page, nextFilter = filter) => {
        setLoading(true);
        try {
            const status = mapFilterToStatus(nextFilter);
            const res = await api.admin.getBusinesses(nextPage, LIMIT, status);
            setListings(res.data || []);
            setMeta(res.meta || { total: 0, totalPages: 1 });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [page, filter]);

    useEffect(() => {
        fetchListings();
    }, [fetchListings]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [page]);

    return (
        <div className="space-y-8 pb-20 min-w-0 overflow-x-hidden">
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Listing Status Monitor</h1>
                    <p className="text-slate-400 font-medium mt-1">
                        {meta.total} listings across processing, approved, rejected, and suspended states.
                    </p>
                </div>
                <button
                    onClick={() => fetchListings()}
                    className="flex items-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 rounded-2xl font-bold text-slate-600 transition-all active:scale-95"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {(['processing', 'approved', 'rejected', 'all'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => {
                            setFilter(tab);
                            setPage(1);
                        }}
                        className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl font-black text-sm transition-all border whitespace-nowrap ${
                            filter === tab
                                ? 'bg-slate-900 text-white border-slate-900 shadow-slate-900/20'
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
                    <p className="text-slate-400 font-medium mt-2 max-w-xs">No listings match this state right now.</p>
                </motion.div>
            ) : (
                <div className="grid gap-6">
                    <AnimatePresence mode="popLayout">
                        {listings.map((listing, idx) => (
                            <motion.div
                                key={listing.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-white rounded-[28px] border border-slate-100 shadow-slate-200/40 overflow-hidden group hover:border-blue-200 transition-all duration-500"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center gap-8 p-8">
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

                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-2xl font-black text-slate-900 mb-2 truncate group-hover:text-blue-600 transition-colors">
                                            {listing.title}
                                        </h3>
                                        <div className="flex flex-wrap gap-y-2 gap-x-5 text-sm">
                                            <span className="flex items-center gap-1.5 text-slate-600 font-bold">
                                                <MapPin className="w-4 h-4 text-blue-500" />
                                                {listing.city}, {listing.state}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-slate-600 font-bold">
                                                <span className="text-slate-400 font-medium">Owner:</span>{' '}
                                                {listing.vendor?.user?.fullName || listing.vendor?.businessName || 'Anonymous Owner'}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-slate-600 font-bold">
                                                <Mail className="w-4 h-4 text-slate-400" />
                                                {listing.vendor?.businessEmail || 'No Email'}
                                            </span>
                                        </div>
                                        <p className="text-slate-400 text-sm mt-4 line-clamp-2 leading-relaxed italic">
                                            {listing.description || 'No description provided by the business.'}
                                        </p>
                                    </div>

                                    <div className="flex flex-row lg:flex-col gap-3 flex-shrink-0">
                                        <div className="px-5 py-3 rounded-[20px] bg-slate-50 text-slate-500 border border-slate-100 text-xs font-black uppercase tracking-widest text-center">
                                            {listing.status === 'pending_geocode' ? 'Waiting for exact map confirmation' : 'Monitoring only'}
                                        </div>
                                        <button
                                            onClick={() => window.open(`/business/${listing.slug}`, '_blank')}
                                            className="flex items-center justify-center gap-2 px-6 py-4 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-[20px] font-black text-sm transition-all active:scale-95"
                                        >
                                            <ExternalLink className="w-5 h-5" /> Preview
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {meta.totalPages > 1 && (
                <div className="flex items-center justify-between pt-8">
                    <p className="text-xs text-slate-400 font-black uppercase tracking-widest">
                        Showing <span className="text-slate-900">{listings.length}</span> of{' '}
                        <span className="text-slate-900">{meta.total}</span> Listings
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage((current) => Math.max(1, current - 1))}
                            className="p-3 rounded-2xl border border-slate-200 bg-white text-slate-600 hover:border-slate-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm shadow-slate-200 active:scale-95"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            disabled={page === meta.totalPages}
                            onClick={() => setPage((current) => Math.min(meta.totalPages, current + 1))}
                            className="p-3 rounded-2xl border border-slate-200 bg-white text-slate-600 hover:border-slate-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm shadow-slate-200 active:scale-95"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
