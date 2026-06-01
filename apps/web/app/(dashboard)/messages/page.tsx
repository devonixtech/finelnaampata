"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api';
import { FeatureGate } from '../../../components/vendor/FeatureGate';
import {
    Send, Mail, Phone, Clock, Search, RefreshCw,
    CheckCircle, XCircle, PhoneCall, TrendingUp,
    ChevronLeft, ChevronRight, X, MessageSquare,
    Filter, ChevronDown, Loader2, Users, Eye, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import Link from 'next/link';

// ─── Types ─────────────────────────────────────────────────────────────
type EnquiryStatus = 'new' | 'contacted' | 'converted' | 'lost';

interface Enquiry {
    id: string;
    name: string;
    email: string;
    phone: string;
    message: string;
    status: EnquiryStatus;
    businessId: string;
    business?: { title: string; slug: string };
    createdAt: string;
    isRead?: boolean;
}

// ─── Constants ─────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<EnquiryStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    new: { label: 'New', color: 'text-violet-700', bg: 'bg-violet-50 border-violet-200', icon: TrendingUp },
    contacted: { label: 'Contacted', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: PhoneCall },
    converted: { label: 'Converted', color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: CheckCircle },
    lost: { label: 'Lost', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: XCircle },
};

function StatusBadge({ status }: { status: EnquiryStatus }) {
    const cfg = STATUS_CONFIG[status];
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.color}`}>
            <Icon className="w-3 h-3" />
            {cfg.label}
        </span>
    );
}

// ─── Detail Modal ───────────────────────────────────────────────────────
function EnquiryDetailModal({ enquiry, onClose, onStatusChange }: {
    enquiry: Enquiry;
    onClose: () => void;
    onStatusChange: (id: string, status: EnquiryStatus) => void;
}) {
    const [updating, setUpdating] = useState(false);

    const handleStatus = async (status: EnquiryStatus) => {
        setUpdating(true);
        await onStatusChange(enquiry.id, status);
        setUpdating(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden z-10"
            >
                {/* Top accent bar */}
                {/* <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 via-blue-500 to-indigo-500" /> */}

                <div className="p-8">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-100 to-blue-100 flex items-center justify-center text-violet-700 font-black text-lg">
                                    {(enquiry.name?.[0] || '?').toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900">{enquiry.name || 'Unknown'}</h2>
                                    {enquiry.business?.title && (
                                        <p className="text-xs text-slate-400 font-medium">for {enquiry.business.title}</p>
                                    )}
                                </div>
                            </div>
                            <div className="mt-2 ml-[52px]">
                                <StatusBadge status={enquiry.status} />
                            </div>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-full hover:bg-slate-100">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-3 mb-6">
                        {enquiry.email && (
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                <a href={`mailto:${enquiry.email}`} className="text-sm font-bold text-blue-600 hover:underline truncate">{enquiry.email}</a>
                            </div>
                        )}
                        {enquiry.phone && (
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                <a href={`tel:${enquiry.phone}`} className="text-sm font-bold text-slate-700">{enquiry.phone}</a>
                            </div>
                        )}
                        {enquiry.message && (
                            <div className="p-4 bg-gradient-to-br from-violet-50 to-blue-50 rounded-xl border border-violet-100">
                                <p className="text-xs font-black text-violet-500 uppercase tracking-widest mb-2">Message</p>
                                <p className="text-sm text-slate-700 leading-relaxed">{enquiry.message}</p>
                            </div>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            Received: {new Date(enquiry.createdAt).toLocaleString()}
                        </div>
                    </div>

                    {/* Quick Reply */}
                    <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Quick Actions</p>
                        <div className="flex gap-2 flex-wrap">
                            {enquiry.email && (
                                <a href={`mailto:${enquiry.email}?subject=Re: Your Query`}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:border-blue-400 hover:text-blue-600 transition-all shadow-sm">
                                    <Mail className="w-4 h-4" /> Reply via Email
                                </a>
                            )}
                            {enquiry.phone && (
                                <a href={`tel:${enquiry.phone}`}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:border-green-400 hover:text-green-600 transition-all shadow-sm">
                                    <Phone className="w-4 h-4" /> Call
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Status Update */}
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Update Status</p>
                        <div className="relative">
                            <select
                                value={enquiry.status}
                                onChange={(e) => handleStatus(e.target.value as EnquiryStatus)}
                                disabled={updating}
                                className="w-full pl-4 pr-10 py-3 rounded-xl text-sm font-bold border border-slate-200 bg-white text-slate-700 focus:border-violet-400 focus:ring-4 focus:ring-violet-50 outline-none transition-all appearance-none cursor-pointer disabled:opacity-50"
                            >
                                {(Object.keys(STATUS_CONFIG) as EnquiryStatus[]).map(s => (
                                    <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

// ─── Stat Card ──────────────────────────────────────────────────────────
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <p className={`text-3xl font-black ${color}`}>{value}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{label}</p>
        </motion.div>
    );
}

// ─── Main Page ──────────────────────────────────────────────────────────
const LIMIT = 15;

export default function BusinessEnquiriesPage() {
    const { user } = useAuth();
    const { refreshCounts } = useSocket();
    const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
    const [stats, setStats] = useState<Record<string, number>>({});
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const activeSub = user?.vendor?.subscriptions?.find((sub: any) => sub.status === 'active');
    const features = activeSub?.plan?.dashboardFeatures || {};
    const isVendor = user?.role === 'vendor';

    const handleSelectEnquiry = async (enq: Enquiry) => {
        setSelectedEnquiry(enq);
        if (!enq.isRead) {
            try {
                await api.leads.markRead(enq.id);
                // Update local state
                setEnquiries(prev => prev.map(item => item.id === enq.id ? { ...item, isRead: true } : item));
                // Refresh global counts for sidebar/header
                refreshCounts();
                // Update stats locally
                setStats(prev => ({
                    ...prev,
                    new: Math.max(0, (prev.new || 0) - 1)
                }));
            } catch (err) {
                console.error('Failed to mark lead as read:', err);
            }
        }
    };

    const fetchEnquiries = useCallback(async (silent = false) => {
        if (!user) { setLoading(false); return; }
        if (!silent) setLoading(true); else setRefreshing(true);
        try {
            const isVendor = user.role === 'vendor';
            const isAdmin = user.role === 'admin' || user.role === 'superadmin';
            const params: any = { page, limit: LIMIT };
            if (filterStatus) params.status = filterStatus;

            const fetchPromises: Promise<any>[] = [
                (isVendor || isAdmin) 
                    ? api.leads.getForVendor(params) 
                    : api.leads.getMyEnquiries(params)
            ];
            
            if (isVendor) {
                fetchPromises.push(api.leads.getStats().catch(() => ({})));
            }

            const results = await Promise.allSettled(fetchPromises);
            const enqRes = results[0];
            const statsRes = isVendor ? results[1] : null;

            if (enqRes.status === 'fulfilled') {
                setEnquiries(enqRes.value.data || []);
                setTotal(enqRes.value.meta?.total || 0);
                setTotalPages(Math.ceil((enqRes.value.meta?.total || 0) / LIMIT));
            } else {
                setEnquiries([]);
            }

            if (statsRes && statsRes.status === 'fulfilled') {
                setStats(statsRes.value || {});
            }
        } catch (e) {
            console.error('Error fetching enquiries:', e);
            setEnquiries([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user, page, filterStatus]);

    useEffect(() => {
        fetchEnquiries();
    }, [user, fetchEnquiries]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-violet-600/20 border-t-violet-600 rounded-full animate-spin" />
                <p className="text-slate-400 font-bold text-sm">Loading queries…</p>
            </div>
        );
    }

    const handleStatusChange = async (id: string, status: EnquiryStatus) => {
        try {
            await api.leads.updateStatus(id, status);
            setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status } : e));
            if (selectedEnquiry?.id === id) setSelectedEnquiry(se => se ? { ...se, status } : se);
        } catch (e) {
            console.error('Failed to update status:', e);
        }
    };

    const filtered = enquiries.filter(e => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (e.name || '').toLowerCase().includes(q)
            || (e.email || '').toLowerCase().includes(q)
            || (e.message || '').toLowerCase().includes(q);
    });

    return (
        <FeatureGate feature="showQueries" title="Customer Enquiries" description="Connect with potential customers directly through our secure messaging system. Respond to leads and convert inquiries into bookings.">
            <div className="min-h-screen pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 bg-gradient-to-br from-violet-100 to-blue-100 rounded-2xl flex items-center justify-center">
                                <Send className="w-5 h-5 text-violet-600" />
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Queries</h1>
                            {stats.new > 0 && (
                                <span className="px-3 py-1 bg-violet-600 text-white text-xs font-black rounded-full animate-pulse">
                                    {stats.new} New
                                </span>
                            )}
                        </div>
                        <p className="text-slate-400 font-bold mt-1 ml-[52px]">Direct messages from customers on your listings</p>
                    </div>
                    <button id="refresh-queries-btn" onClick={() => fetchEnquiries(true)} disabled={refreshing}
                        className="p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm self-start">
                        <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard label="Total" value={total} color="text-slate-900" />
                    <StatCard label="New" value={stats.new || 0} color="text-violet-600" />
                    <StatCard label="Contacted" value={stats.contacted || 0} color="text-amber-600" />
                    <StatCard label="Converted" value={stats.converted || 0} color="text-green-600" />
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input id="query-search" type="text" placeholder="Search by name, email, or message…"
                            value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 text-sm font-medium bg-slate-50 rounded-xl border border-transparent focus:border-violet-400 focus:bg-white outline-none transition-all" />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <select id="query-status-filter" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                            className="pl-9 pr-8 py-2.5 text-sm font-bold bg-slate-50 rounded-xl border border-transparent focus:border-violet-400 outline-none appearance-none cursor-pointer">
                            <option value="">All Statuses</option>
                            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {/* List */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <div className="w-12 h-12 border-4 border-violet-600/20 border-t-violet-600 rounded-full animate-spin" />
                            <p className="text-slate-400 font-bold text-sm">Loading queries…</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <div className="w-20 h-20 bg-gradient-to-br from-violet-50 to-blue-50 rounded-3xl flex items-center justify-center">
                                <MessageSquare className="w-10 h-10 text-violet-300" />
                            </div>
                            <div className="text-center">
                                <p className="text-slate-700 font-black text-lg">No queries yet</p>
                                <p className="text-slate-400 text-sm mt-1">When customers send you a message from your listing, it will appear here</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Desktop table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/50">
                                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">From</th>
                                            <th className="px-4 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Type</th>
                                            <th className="px-4 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Message</th>
                                            <th className="px-4 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                                            <th className="px-4 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                                            <th className="px-4 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        <AnimatePresence>
                                            {filtered.map((enq, i) => {
                                                const isUnread = !enq.isRead;
                                                return (
                                                <motion.tr key={enq.id}
                                                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.03 }}
                                                    className={`hover:bg-violet-50/30 transition-colors group cursor-pointer ${isUnread ? 'bg-violet-50/10' : ''}`}
                                                    onClick={() => handleSelectEnquiry(enq)}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${isUnread ? 'bg-gradient-to-br from-violet-200 to-blue-200 text-violet-700' : 'bg-slate-100 text-slate-500'}`}>
                                                                {(enq.name?.[0] || '?').toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className={`font-black text-sm whitespace-nowrap ${isUnread ? 'text-slate-900' : 'text-slate-600'}`}>{enq.name || '—'}</p>
                                                                {enq.email && <p className="text-xs text-slate-400 font-medium whitespace-nowrap">{enq.email}</p>}
                                                                {enq.phone && <a href={`tel:${enq.phone}`} onClick={e => e.stopPropagation()} className="text-xs text-blue-500 font-bold hover:underline whitespace-nowrap">{enq.phone}</a>}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-lg">
                                                            {(enq as any).type || 'Query'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 max-w-[260px]">
                                                        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{enq.message || '—'}</p>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="relative inline-block mt-0.5">
                                                            <select
                                                                value={enq.status}
                                                                onChange={(e) => {
                                                                    e.stopPropagation();
                                                                    handleStatusChange(enq.id, e.target.value as EnquiryStatus);
                                                                }}
                                                                onClick={e => e.stopPropagation()}
                                                                className={`appearance-none pl-3 pr-8 py-1 rounded-full text-xs font-bold border outline-none cursor-pointer transition-all ${STATUS_CONFIG[enq.status].bg} ${STATUS_CONFIG[enq.status].color} focus:ring-2 focus:ring-current/20`}
                                                            >
                                                                {(Object.keys(STATUS_CONFIG) as EnquiryStatus[]).map(s => (
                                                                    <option key={s} value={s} className="bg-white text-slate-900 font-bold">{STATUS_CONFIG[s].label}</option>
                                                                ))}
                                                            </select>
                                                            <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-60`} />
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <p className="text-xs text-slate-400 font-medium whitespace-nowrap">
                                                            {new Date(enq.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <button className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:bg-violet-100 hover:text-violet-600 transition-all opacity-0 group-hover:opacity-100">
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </motion.tr>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile cards */}
                            <div className="md:hidden divide-y divide-slate-50">
                                {filtered.map(enq => {
                                    const isUnread = enq.status === 'new' && !enq.isRead;
                                    return (
                                        <div key={enq.id} className={`p-4 flex items-start gap-3 ${isUnread ? 'bg-violet-50/30' : ''}`} onClick={() => handleSelectEnquiry(enq)}>
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black flex-shrink-0 ${isUnread ? 'bg-gradient-to-br from-violet-200 to-blue-200 text-violet-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {(enq.name?.[0] || '?').toUpperCase()}
                                            </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <p className="font-black text-slate-900 text-sm truncate">{enq.name || '—'}</p>
                                                <StatusBadge status={enq.status} />
                                            </div>
                                            {enq.message && <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{enq.message}</p>}
                                            <p className="text-[10px] text-slate-300 font-medium mt-1">{new Date(enq.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                                    <p className="text-xs text-slate-400 font-medium">Page {page} of {totalPages} · {total} total</p>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:border-slate-300 disabled:opacity-40">
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:border-slate-300 disabled:opacity-40">
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Detail Modal */}
                <AnimatePresence>
                    {selectedEnquiry && (
                        <EnquiryDetailModal
                            enquiry={selectedEnquiry}
                            onClose={() => setSelectedEnquiry(null)}
                            onStatusChange={handleStatusChange}
                        />
                    )}
                </AnimatePresence>
            </div>
        </FeatureGate>
    );
}
