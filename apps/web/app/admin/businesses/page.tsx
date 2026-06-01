"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    Briefcase, Search, RefreshCw, Loader2, CheckCircle2, XCircle,
    AlertCircle, Clock, MoreVertical, Trash2, MapPin, Tag,
    ExternalLink, ChevronLeft, ChevronRight, Store, Filter, Star,
    Phone
} from 'lucide-react';
import { api, getImageUrl } from '../../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';

type BusinessStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

const STATUS_CONFIG: Record<BusinessStatus, { label: string; cls: string; Icon: any }> = {
    pending: { label: 'Pending', cls: 'bg-amber-50/50 text-amber-600 border-amber-100', Icon: Clock },
    approved: { label: 'Approved', cls: 'bg-emerald-50/50 text-emerald-600 border-emerald-100', Icon: CheckCircle2 },
    rejected: { label: 'Rejected', cls: 'bg-rose-50/50 text-rose-600 border-rose-100', Icon: XCircle },
    suspended: { label: 'Suspended', cls: 'bg-slate-50 text-slate-500 border-slate-200', Icon: AlertCircle },
};

const StatusBadge = ({ status }: { status: BusinessStatus }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${config.cls}`}>
            <config.Icon className="w-3 h-3" /> {config.label}
        </span>
    );
};

export default function AdminBusinessesPage() {
    const { user: currentUser } = useAuth();
    const [businesses, setBusinesses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | BusinessStatus>('all');
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState<any>({ total: 0, totalPages: 1 });
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const LIMIT = 10;

    const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number, left: number } | null>(null);

    const fetchBusinesses = useCallback(async (p = page, s = statusFilter, q = search) => {
        setLoading(true);
        try {
            const res = await api.admin.getBusinesses(p, LIMIT, s === 'all' ? undefined : s, q);
            setBusinesses(res.data || []);
            setMeta(res.meta || { total: 0, totalPages: 1 });
        } catch (err) {
            console.error('Failed to fetch businesses', err);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, search]);

    useEffect(() => {
        const timer = setTimeout(() => fetchBusinesses(), 300);
        return () => clearTimeout(timer);
    }, [page, statusFilter, search, fetchBusinesses]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [page]);

    const handleModerate = async (id: string, status: BusinessStatus) => {
        setActionLoading(id + '-moderate');
        try {
            await api.admin.moderateBusiness(id, status);
            setBusinesses(prev => prev.map(b => b.id === id ? { ...b, status } : b));
        } catch (err: any) {
            alert(err.message || 'Failed to moderate business');
        } finally {
            setActionLoading(null);
            setOpenMenu(null);
        }
    };

    const handleToggleFeatured = async (id: string, isFeatured: boolean) => {
        setActionLoading(id + '-featured');
        try {
            await api.admin.toggleFeatured(id, isFeatured);
            setBusinesses(prev => prev.map(b => b.id === id ? { ...b, isFeatured } : b));
        } catch (err: any) {
            alert(err.message || 'Failed to update featured status');
        } finally {
            setActionLoading(null);
            setOpenMenu(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to PERMANENTLY delete this business listing? This action cannot be undone.')) {
            return;
        }

        setActionLoading(id + '-delete');
        try {
            await api.admin.deleteBusiness(id);
            setBusinesses(prev => prev.filter(b => b.id !== id));
            setMeta((m: any) => ({ ...m, total: m.total - 1 }));
        } catch (err: any) {
            alert(err.message || 'Failed to delete business');
        } finally {
            setActionLoading(null);
            setOpenMenu(null);
        }
    };

    return (
        <div className="space-y-8 pb-20" onClick={() => setOpenMenu(null)}>
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Business Management</h1>
                    <p className="text-slate-400 font-medium mt-1">
                        {meta.total} total listings — review, moderate, and manage business records.
                    </p>
                </div>
                <button
                    onClick={() => fetchBusinesses()}
                    className="flex items-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 rounded-2xl font-bold text-slate-600 transition-all"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </button>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by business name, city, address..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-slate-300 placeholder:text-slate-400 text-sm shadow-sm transition-all"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                    {(['all', 'pending', 'approved', 'rejected', 'suspended'] as const).map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-5 py-3.5 rounded-2xl font-bold text-sm transition-all border whitespace-nowrap ${statusFilter === s
                                ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'
                                }`}
                        >
                            {s === 'all' ? 'All Listings' : s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {loading && businesses.length === 0 ? (
                <div className="flex items-center justify-center py-32">
                    <Loader2 className="w-10 h-10 animate-spin text-slate-300" />
                </div>
            ) : businesses.length === 0 ? (
                <div className="bg-white rounded-[28px] p-20 flex flex-col items-center text-center border-2 border-dashed border-slate-100">
                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                        <Store className="w-10 h-10 text-slate-200" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900">No businesses found</h3>
                    <p className="text-slate-400 font-medium mt-2 max-w-xs">Try adjusting your search or filters to find what you're looking for.</p>
                </div>
            ) : (
                <div className={`bg-white rounded-[28px] border border-slate-100 shadow-slate-200/50 relative ${openMenu ? 'z-[60]' : ''}`}>
                    <div className="overflow-x-auto scrollbar-hide">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-50">
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-left">Business Listing</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-left">Owner / Business</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-left">Category / Details</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-left">Status</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence mode='popLayout'>
                                    {businesses.map((b, idx) => (
                                        <motion.tr
                                            key={b.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: idx * 0.03 }}
                                            className={`group border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors ${openMenu === b.id ? 'relative z-50 bg-slate-50/80' : 'relative z-0'}`}
                                        >
                                            <td className="px-6 py-5 cursor-pointer" onClick={() => setSelectedBusiness(b)}>
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex-shrink-0 overflow-hidden shadow-inner flex items-center justify-center border border-slate-100">
                                                            {(b.logoUrl || b.coverImageUrl || (b.images && b.images.length > 0)) ? (
                                                                <img 
                                                                    src={getImageUrl(b.logoUrl || b.coverImageUrl || b.images[0]) || ''} 
                                                                    alt={b.title} 
                                                                    className="w-full h-full object-cover" 
                                                                />
                                                            ) : (
                                                                <Store className="w-6 h-6 text-slate-300" />
                                                            )}
                                                        </div>
                                                        {b.isFeatured && (
                                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                                                <Star className="w-2.5 h-2.5 text-white fill-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-black text-slate-900 text-sm truncate group-hover:text-blue-600 transition-colors">{b.title}</p>
                                                        <p className="text-[11px] text-slate-400 font-bold flex items-center gap-1 mt-1">
                                                            <MapPin className="w-3 h-3" /> {b.city}, {b.state}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-700">{b.vendor?.user?.fullName || b.vendor?.businessName || 'Anonymous Owner'}</span>
                                                    <span className="text-[11px] text-slate-400 font-medium">{b.vendor?.businessEmail || 'No Email'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-xl text-[11px] font-bold border border-slate-100 w-fit">
                                                        <Tag className="w-3 h-3" /> {b.category?.name || 'Uncategorized'}
                                                    </span>
                                                    {b.isVerified && (
                                                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest pl-1">Trusted Member</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <StatusBadge status={b.status} />
                                            </td>
                                            <td className="px-6 py-5 text-right">                                                <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => setSelectedBusiness(b)}
                                                        className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 transition-all shadow-sm"
                                                        title="Quick View"
                                                    >
                                                        <Search className="w-4 h-4" />
                                                    </button>
                                                    
                                                    <div className="relative inline-block text-left">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (openMenu === b.id) {
                                                                    setOpenMenu(null);
                                                                } else {
                                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                                    setMenuPosition({
                                                                        top: rect.bottom + window.scrollY,
                                                                        left: rect.right + window.scrollX
                                                                    });
                                                                    setOpenMenu(b.id);
                                                                }
                                                            }}
                                                            className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all border ${openMenu === b.id
                                                                ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                                                                : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100 border-transparent hover:border-slate-200'}`}
                                                        >
                                                            {actionLoading?.startsWith(b.id) ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <MoreVertical className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>

                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>

                    {/* Footer / Pagination */}
                    {meta.totalPages > 1 && (
                        <div className="px-6 py-6 bg-slate-50/30 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <p className="text-xs text-slate-400 font-black uppercase tracking-widest">
                                Showing <span className="text-slate-900">{businesses.length}</span> of <span className="text-slate-900">{meta.total}</span> Listings
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    className="p-2.5 rounded-2xl border border-slate-200 bg-white text-slate-600 hover:border-slate-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <div className="flex items-center gap-1.5">
                                    {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                                        const p = Math.max(1, Math.min(meta.totalPages - 4, page - 2)) + i;
                                        if (p < 1 || p > meta.totalPages) return null;
                                        return (
                                            <button
                                                key={p}
                                                onClick={() => setPage(p)}
                                                className={`w-10 h-10 rounded-2xl font-black text-xs transition-all border ${page === p
                                                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20'
                                                    : 'bg-white border-slate-200 text-slate-400 hover:border-slate-400 shadow-sm'
                                                    }`}
                                            >
                                                {p}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    disabled={page === meta.totalPages}
                                    onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                                    className="p-2.5 rounded-2xl border border-slate-200 bg-white text-slate-600 hover:border-slate-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Business Details Modal */}
            <AnimatePresence>
                {selectedBusiness && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedBusiness(null)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-white rounded-[20px] shadow-2xl overflow-hidden border border-slate-100"
                        >
                            <div className="p-10">
                                <div className="flex items-start justify-between mb-10">
                                    <div className="flex items-center gap-5">
                                        <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shadow-sm shrink-0">
                                            {(selectedBusiness.logoUrl || selectedBusiness.coverImageUrl || (selectedBusiness.images && selectedBusiness.images.length > 0)) ? (
                                                <img 
                                                    src={getImageUrl(selectedBusiness.logoUrl || selectedBusiness.coverImageUrl || selectedBusiness.images[0]) || ''} 
                                                    className="w-full h-full object-cover" 
                                                />
                                            ) : (
                                                <Store className="w-10 h-10 text-slate-200" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1.5">
                                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedBusiness.title}</h2>
                                                {selectedBusiness.isVerified && (
                                                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
                                                        <CheckCircle2 className="w-3 h-3 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{selectedBusiness.category?.name}</span>
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                                <StatusBadge status={selectedBusiness.status} />
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedBusiness(null)}
                                        className="p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl transition-all border border-transparent hover:border-slate-100 active:scale-95"
                                    >
                                        <XCircle className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
                                    <div className="space-y-8">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Contact Information</p>
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3 text-sm text-slate-600 group">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                                                        <Phone className="w-4 h-4" />
                                                    </div>
                                                    <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{selectedBusiness.phone}</span>
                                                </div>
                                                {selectedBusiness.whatsapp && (
                                                    <div className="flex items-center gap-3 text-sm text-slate-600">
                                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 font-black">W</div>
                                                        <span className="font-bold text-slate-900">{selectedBusiness.whatsapp}</span>
                                                    </div>
                                                )}
                                                {selectedBusiness.website && (
                                                    <div className="flex items-center gap-3 text-sm text-slate-600">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                                            <Tag className="w-4 h-4" />
                                                        </div>
                                                        <span className="font-medium text-slate-500 truncate">{selectedBusiness.website.replace(/^https?:\/\//, '')}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Physical Address</p>
                                            <div className="flex gap-4 text-sm text-slate-600">
                                                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                                                    <MapPin className="w-4 h-4" />
                                                </div>
                                                <p className="font-bold leading-relaxed text-slate-900">
                                                    {selectedBusiness.address}<br />
                                                    <span className="text-slate-400 font-medium">{selectedBusiness.city}, {selectedBusiness.state} {selectedBusiness.pincode}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-8">
                                        <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100">
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Business Details</p>
                                            <div className="space-y-3">
                                                <p className="font-black text-slate-900 text-lg">{selectedBusiness.vendor?.businessName || 'Business Owner'}</p>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-bold text-slate-500">{selectedBusiness.vendor?.businessPhone}</p>
                                                    <p className="text-xs font-medium text-slate-400">{selectedBusiness.vendor?.businessEmail}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Operational Status</p>
                                            <div className="flex flex-wrap gap-2">
                                                <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border ${selectedBusiness.isVerified ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                                    {selectedBusiness.isVerified ? 'Trusted' : 'Not Trusted'}
                                                </span>
                                                {selectedBusiness.isFeatured && (
                                                    <span className="px-4 py-2 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl text-[10px] font-black uppercase tracking-wider">Featured Asset</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {selectedBusiness.searchKeywords && selectedBusiness.searchKeywords.length > 0 && (
                                    <div className="border-t border-slate-50 pt-8 mt-6">
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Search Keywords</p>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedBusiness.searchKeywords.map((kw: string, i: number) => (
                                                <span key={i} className="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-slate-100 flex items-center gap-2">
                                                    <Search className="w-3 h-3 text-slate-400" />
                                                    {kw}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="border-t border-slate-50 pt-8 mt-10">
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Business Narrative</p>
                                    <p className="text-slate-500 text-sm leading-relaxed whitespace-pre-line font-medium italic">
                                        "{selectedBusiness.description || 'No detailed description remains for this listing.'}"
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Action Menu Portal */}
            {typeof document !== 'undefined' && openMenu && menuPosition && createPortal(
                <AnimatePresence>
                    {businesses.find(b => b.id === openMenu) && (() => {
                        const b = businesses.find(b => b.id === openMenu);
                        return (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                className="absolute z-[9999] bg-white rounded-3xl shadow-2xl shadow-slate-900/40 border border-slate-100 py-3 w-64 overflow-hidden"
                                style={{
                                    top: menuPosition.top + 12,
                                    left: menuPosition.left - 256
                                }}
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="px-6 pb-2.5 mb-2 border-b border-slate-50">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300">Management Actions</p>
                                </div>

                                <button
                                    onClick={() => { setSelectedBusiness(b); setOpenMenu(null); }}
                                    className="flex items-center gap-3 w-full px-6 py-3.5 text-xs font-black text-slate-900 hover:bg-slate-50 transition-all text-left uppercase tracking-wider group"
                                >
                                    <Search className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" /> View Details
                                </button>

                                <div className="h-[1px] bg-slate-50 mx-4 my-1" />

                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 px-6 pt-3 pb-1.5 focus:outline-none">Moderation</p>

                                {b.status !== 'approved' && (
                                    <button
                                        onClick={() => handleModerate(b.id, 'approved')}
                                        className="flex items-center gap-3 w-full px-6 py-3 text-xs font-black text-emerald-600 hover:bg-emerald-50 transition-all text-left uppercase tracking-wider group"
                                    >
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" /> Approve Listing
                                    </button>
                                )}

                                {b.status !== 'suspended' && (
                                    <button
                                        onClick={() => handleModerate(b.id, 'suspended')}
                                        className="flex items-center gap-3 w-full px-6 py-3 text-xs font-black text-slate-900 hover:bg-slate-50 transition-all text-left uppercase tracking-wider group"
                                    >
                                        <XCircle className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors" /> Block Business
                                    </button>
                                )}

                                {b.status === 'suspended' && (
                                    <button
                                        onClick={() => handleModerate(b.id, 'approved')}
                                        className="flex items-center gap-3 w-full px-6 py-3 text-xs font-black text-emerald-600 hover:bg-emerald-50 transition-all text-left uppercase tracking-wider group"
                                    >
                                        <RefreshCw className="w-4 h-4 text-emerald-400 group-hover:rotate-180 transition-transform" /> Unblock Business
                                    </button>
                                )}

                                {b.status !== 'rejected' && (
                                    <button
                                        onClick={() => handleModerate(b.id, 'rejected')}
                                        className="flex items-center gap-3 w-full px-6 py-3 text-xs font-black text-rose-500 hover:bg-rose-50 transition-all text-left uppercase tracking-wider group"
                                    >
                                        <Trash2 className="w-4 h-4 text-rose-300 group-hover:scale-110 transition-transform" /> Reject Entry
                                    </button>
                                )}

                                <div className="h-[1px] bg-slate-50 mx-4 my-2" />
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 px-6 pt-2 pb-1.5">Promotion</p>

                                <button
                                    onClick={() => handleToggleFeatured(b.id, !b.isFeatured)}
                                    className={`flex items-center gap-3 w-full px-6 py-3 text-xs font-black transition-all text-left uppercase tracking-wider group ${b.isFeatured ? 'text-amber-600 hover:bg-amber-50' : 'text-slate-900 hover:bg-slate-50'}`}
                                >
                                    <Star className={`w-4 h-4 ${b.isFeatured ? 'fill-amber-400 text-amber-400' : 'text-slate-300 group-hover:text-amber-400'} transition-all`} />
                                    {b.isFeatured ? 'Remove Featured' : 'Mark Featured'}
                                </button>

                                <div className="h-[1px] bg-slate-50 mx-4 my-2" />

                                <button
                                    onClick={() => { window.open(`/business/${b.slug}`, '_blank'); setOpenMenu(null); }}
                                    className="flex items-center gap-3 w-full px-6 py-3.5 text-xs font-black text-blue-600 hover:bg-blue-50 transition-all text-left uppercase tracking-wider group"
                                >
                                    <ExternalLink className="w-4 h-4 text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /> Public Page
                                </button>

                                {currentUser?.role === 'superadmin' && (
                                    <button
                                        onClick={() => handleDelete(b.id)}
                                        className="flex items-center gap-3 w-full px-6 py-3.5 text-xs font-black text-rose-600 hover:bg-rose-100/50 transition-all text-left uppercase tracking-wider group"
                                    >
                                        <AlertCircle className="w-4 h-4 text-rose-400" /> Permanent Delete
                                    </button>
                                )}
                            </motion.div>
                        );
                    })()}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
