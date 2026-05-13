"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    ShieldCheck, ShieldAlert, Search, RefreshCw, Loader2,
    CheckCircle2, XCircle, FileText, User as UserIcon,
    Mail, Phone, MapPin, ExternalLink, ChevronLeft,
    ChevronRight, Briefcase, Eye, Ban
} from 'lucide-react';
import { api, getImageUrl } from '../../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminVerificationsPage() {
    const [vendors, setVendors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'verified' | 'unverified'>('all');
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState<any>({ total: 0, totalPages: 1 });
    const [selectedVendor, setSelectedVendor] = useState<any | null>(null);
    const LIMIT = 10;

    const fetchVendors = useCallback(async (p = page, f = filter, q = search) => {
        setLoading(true);
        try {
            const isVerified = f === 'verified' ? true : f === 'unverified' ? false : undefined;
            const res = await api.admin.getVendors(p, LIMIT, isVerified, q);
            setVendors(res.data || []);
            setMeta(res.meta || { total: 0, totalPages: 1 });
        } catch (err) {
            console.error('Failed to fetch vendors', err);
        } finally {
            setLoading(false);
        }
    }, [page, filter, search]);

    useEffect(() => {
        const timer = setTimeout(() => fetchVendors(), 300);
        return () => clearTimeout(timer);
    }, [page, filter, search, fetchVendors]);

    const handleVerify = async (vendorId: string, status: boolean) => {
        setActionLoading(vendorId);
        try {
            await api.admin.verifyVendor(vendorId, status);
            setVendors(prev => prev.map(v => v.id === vendorId ? { ...v, isVerified: status } : v));
            if (selectedVendor?.id === vendorId) {
                setSelectedVendor({ ...selectedVendor, isVerified: status });
            }
        } catch (err: any) {
            alert(err.message || 'Failed to update verification status');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Vendor Verification</h1>
                    <p className="text-slate-400 font-medium mt-1">
                        Review and verify vendor business documentation and credentials.
                    </p>
                </div>
                <button
                    onClick={() => fetchVendors()}
                    className="flex items-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 rounded-2xl font-bold text-slate-600 transition-all"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </button>
            </div>

            {/* Quick Stats & Search */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
                <div className="lg:col-span-3 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative w-full">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                            <Search className="w-5 h-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by business name or email..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 h-[58px] rounded-[20px] border border-slate-200 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-slate-300 placeholder:text-slate-400 text-sm shadow-sm transition-all"
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        {(['all', 'unverified', 'verified'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => { setFilter(f); setPage(1); }}
                                className={`flex-1 md:flex-none px-6 h-[58px] rounded-[20px] font-black text-sm transition-all border capitalize ${filter === f
                                    ? 'bg-slate-900 text-white border-slate-900  shadow-slate-900/20'
                                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="bg-emerald-50 rounded-[24px] h-[70px] lg:h-[58px] px-6 border border-emerald-100 flex items-center justify-between shadow-sm">
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60 leading-none mb-1">Total Verified</p>
                        <p className="text-xl font-black text-emerald-700 leading-none">{meta.totalVerified ?? '0'}</p>
                    </div>
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0 ml-3">
                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    </div>
                </div>
            </div>

            {/* Table */}
            {loading && vendors.length === 0 ? (
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="w-10 h-10 animate-spin text-slate-300" />
                </div>
            ) : vendors.length === 0 ? (
                <div className="bg-white rounded-[28px] p-24 flex flex-col items-center text-center border border-slate-100 shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                        <Briefcase className="w-10 h-10 text-slate-200" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900">No vendors found</h3>
                    <p className="text-slate-400 font-medium mt-2 max-w-xs">There are no vendors matching your current filters.</p>
                </div>
            ) : (
                <div className="bg-white rounded-[28px] border border-slate-100  shadow-slate-200/50 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Vendor / Business</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Credentials</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Created At</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence mode='popLayout'>
                                    {vendors.map((v, idx) => (
                                        <motion.tr
                                            key={v.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: idx * 0.03 }}
                                            className="group border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                                        >
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex-shrink-0 flex items-center justify-center shadow-inner overflow-hidden">
                                                        {v.user?.avatarUrl ? (
                                                            <img
                                                                src={getImageUrl(v.user.avatarUrl) || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTuu4dy4fOi7lH5GxvLcdAoyx5Kf5A7EE7mCA&s"}
                                                                className="w-full h-full object-cover"
                                                                alt="Avatar"
                                                            />
                                                        ) : (
                                                            <UserIcon className="w-6 h-6 text-slate-300" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-black text-slate-900 text-sm truncate">{v.businessName || 'Unnamed Business'}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <Mail className="w-3 h-3 text-slate-400" />
                                                            <span className="text-[11px] text-slate-500 font-medium truncate">{v.businessEmail}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col gap-1">
                                                    {v.gstNumber && (
                                                        <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1.5">
                                                            <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[8px] uppercase tracking-wider">GST</span>
                                                            {v.gstNumber}
                                                        </span>
                                                    )}
                                                    {v.ntnNumber && (
                                                        <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1.5">
                                                            <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[8px] uppercase tracking-wider">NTN</span>
                                                            {v.ntnNumber}
                                                        </span>
                                                    )}
                                                    {!v.gstNumber && !v.ntnNumber && <span className="text-xs text-slate-300">No credentials</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-xs text-slate-500 font-medium">{new Date(v.createdAt).toLocaleDateString()}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                {v.isVerified ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider border border-emerald-100">
                                                        <ShieldCheck className="w-3.5 h-3.5" /> Verified
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-wider border border-amber-100">
                                                        <ShieldAlert className="w-3.5 h-3.5" /> Unverified
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <button
                                                    onClick={() => setSelectedVendor(v)}
                                                    className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all shadow-sm active:scale-95"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {meta.totalPages > 1 && (
                        <div className="px-6 py-6 border-t border-slate-50 flex items-center justify-between">
                            <p className="text-xs text-slate-400 font-black uppercase tracking-widest">
                                Page <span className="text-slate-900">{page}</span> of {meta.totalPages}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                    className="p-2.5 rounded-2xl border border-slate-200 disabled:opacity-30"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    disabled={page === meta.totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                    className="p-2.5 rounded-2xl border border-slate-200 disabled:opacity-30"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Vendor Detail Modal */}
            <AnimatePresence>
                {selectedVendor && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedVendor(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-[1rem] p-10 max-w-2xl w-full shadow-2xl relative overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <button onClick={() => setSelectedVendor(null)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-colors">
                                <XCircle className="w-8 h-8" />
                            </button>

                            <div className="flex items-start gap-8 mb-10">
                                <div className="w-24 h-24 rounded-[2rem] bg-slate-100 flex-shrink-0 flex items-center justify-center shadow-inner overflow-hidden">
                                    {selectedVendor.user?.avatarUrl ? (
                                        <img
                                            src={getImageUrl(selectedVendor.user.avatarUrl) || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTuu4dy4fOi7lH5GxvLcdAoyx5Kf5A7EE7mCA&s"}
                                            className="w-full h-full object-cover"
                                            alt="Avatar"
                                        />
                                    ) : (
                                        <UserIcon className="w-10 h-10 text-slate-200" />
                                    )}
                                </div>
                                <div className="flex-1 pt-2">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">{selectedVendor.businessName}</h2>
                                        {selectedVendor.isVerified && <ShieldCheck className="w-7 h-7 text-emerald-500 fill-emerald-50" />}
                                    </div>
                                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                                        <span className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                            <Mail className="w-4 h-4 text-slate-300" /> {selectedVendor.businessEmail}
                                        </span>
                                        <span className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                            <Phone className="w-4 h-4 text-slate-300" /> {selectedVendor.businessPhone || 'No Phone'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 mb-10">
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">Business Address</p>
                                        <div className="bg-slate-50 rounded-2xl p-4 flex gap-3">
                                            <MapPin className="w-5 h-5 text-slate-300 shrink-0" />
                                            <p className="text-sm font-bold text-slate-600 leading-relaxed">{selectedVendor.businessAddress || 'No Address Provided'}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">Business Account</p>
                                        <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                                <UserIcon className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <p className="text-sm font-bold text-slate-900 line-clamp-1">{selectedVendor.user?.fullName || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">Identification Numbers</p>
                                    <div className="bg-slate-50 rounded-2xl p-5 space-y-4">
                                        <div className="flex items-center justify-between border-b border-slate-200/50 pb-3">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GST Number</span>
                                            <span className="text-sm font-black text-slate-900">{selectedVendor.gstNumber || '—'}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NTN Number</span>
                                            <span className="text-sm font-black text-slate-900">{selectedVendor.ntnNumber || '—'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                {selectedVendor.isVerified ? (
                                    <button
                                        onClick={() => handleVerify(selectedVendor.id, false)}
                                        disabled={!!actionLoading}
                                        className="flex-1 px-8 py-5 bg-white hover:bg-red-50 text-red-600 border border-red-100 rounded-[2rem] font-black text-sm flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {actionLoading === selectedVendor.id
                                            ? <Loader2 className="w-5 h-5 animate-spin" />
                                            : <><Ban className="w-5 h-5" /> Revoke Verification</>}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleVerify(selectedVendor.id, true)}
                                        disabled={!!actionLoading}
                                        className="flex-1 px-8 py-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[2rem] font-black text-sm flex items-center justify-center gap-3  shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {actionLoading === selectedVendor.id
                                            ? <Loader2 className="w-5 h-5 animate-spin" />
                                            : <><ShieldCheck className="w-6 h-6" /> Verify Vendor Profile</>}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
