"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    ShieldCheck,
    CheckCircle,
    XCircle,
    Search,
    Clock,
    User as UserIcon,
    FileText,
    ExternalLink,
    RefreshCcw,
    ChevronLeft,
    AlertTriangle,
} from 'lucide-react';
import { api } from '../../../../lib/api';
import { formatDistanceToNow } from 'date-fns';

interface KycSubmission {
    id: string;
    kycStatus: 'pending' | 'approved' | 'rejected';
    kycDocumentUrl?: string;
    kycSubmittedAt?: string;
    kycReviewedAt?: string;
    createdAt: string;
    user: {
        id: string;
        fullName: string;
        email?: string;
        avatarUrl?: string;
    };
    referralCode: string;
}

export default function KycReviewPage() {
    const [submissions, setSubmissions] = useState<KycSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('pending');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchSubmissions = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.admin.affiliate.getAffiliates();
            const filtered = (data || []).filter((a: any) => a.kycStatus !== 'none');
            setSubmissions(filtered);
        } catch (err) {
            console.error('Failed to fetch KYC submissions:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

    const handleReview = async (id: string, status: 'approved' | 'rejected') => {
        setActionLoading(id);
        try {
            await api.admin.affiliate.reviewKyc(id, status);
            setSubmissions(prev => prev.map(s => s.id === id ? {
                ...s,
                kycStatus: status,
                kycReviewedAt: new Date().toISOString(),
            } : s));
        } catch (err) {
            console.error('KYC review failed:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const filtered = submissions.filter(s => {
        const matchesSearch = !search ||
            s.user?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
            s.referralCode?.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'all' || s.kycStatus === filter;
        return matchesSearch && matchesFilter;
    });

    const pendingCount = submissions.filter(s => s.kycStatus === 'pending').length;
    const approvedCount = submissions.filter(s => s.kycStatus === 'approved').length;
    const rejectedCount = submissions.filter(s => s.kycStatus === 'rejected').length;

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'approved': return { icon: CheckCircle, color: 'bg-emerald-50 text-emerald-700 border-emerald-100', label: 'Approved' };
            case 'rejected': return { icon: XCircle, color: 'bg-red-50 text-red-600 border-red-100', label: 'Rejected' };
            case 'pending': return { icon: Clock, color: 'bg-amber-50 text-amber-600 border-amber-100', label: 'Pending Review' };
            default: return { icon: Clock, color: 'bg-slate-50 text-slate-400 border-slate-200', label: status };
        }
    };

    return (
        <div className="space-y-7 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                    <Link href="/admin/affiliates" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors mb-3">
                        <ChevronLeft className="w-3 h-3" /> Back to Affiliates
                    </Link>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-1">
                        KYC <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">Review</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-sm">Review and approve or reject affiliate identity verification documents.</p>
                </div>
                <button
                    onClick={fetchSubmissions}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50 self-start"
                >
                    <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <button
                    onClick={() => setFilter('pending')}
                    className={`rounded-2xl border p-5 flex items-center gap-4 shadow-sm transition-all ${filter === 'pending' ? 'bg-amber-50 border-amber-200 ring-2 ring-amber-500/20' : 'bg-white border-slate-100'}`}
                >
                    <div className="w-11 h-11 bg-amber-100 rounded-xl flex items-center justify-center">
                        <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-slate-900">{pendingCount}</p>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Pending</p>
                    </div>
                </button>
                <button
                    onClick={() => setFilter('approved')}
                    className={`rounded-2xl border p-5 flex items-center gap-4 shadow-sm transition-all ${filter === 'approved' ? 'bg-emerald-50 border-emerald-200 ring-2 ring-emerald-500/20' : 'bg-white border-slate-100'}`}
                >
                    <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-slate-900">{approvedCount}</p>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Approved</p>
                    </div>
                </button>
                <button
                    onClick={() => setFilter('rejected')}
                    className={`rounded-2xl border p-5 flex items-center gap-4 shadow-sm transition-all ${filter === 'rejected' ? 'bg-red-50 border-red-200 ring-2 ring-red-500/20' : 'bg-white border-slate-100'}`}
                >
                    <div className="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center">
                        <XCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-slate-900">{rejectedCount}</p>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Rejected</p>
                    </div>
                </button>
            </div>

            {/* Search */}
            <div className="bg-white border border-slate-100 rounded-2xl p-3.5 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search by name or referral code..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all"
                    />
                </div>
            </div>

            {/* KYC List */}
            <div className="space-y-3">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-slate-100 rounded-2xl" />
                                <div className="flex-grow space-y-2">
                                    <div className="h-4 w-32 bg-slate-100 rounded-full" />
                                    <div className="h-3 w-48 bg-slate-100 rounded-full" />
                                </div>
                            </div>
                        </div>
                    ))
                ) : filtered.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 py-16 flex flex-col items-center justify-center text-center gap-3">
                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                            <ShieldCheck className="w-7 h-7 text-slate-200" />
                        </div>
                        <p className="font-bold text-slate-900">No KYC submissions</p>
                        <p className="text-xs text-slate-400">Nothing matches the current filter.</p>
                    </div>
                ) : (
                    filtered.map(sub => {
                        const statusConfig = getStatusConfig(sub.kycStatus);
                        const StatusIcon = statusConfig.icon;
                        return (
                            <div
                                key={sub.id}
                                className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                    <div className="flex items-center gap-4 flex-grow">
                                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 font-bold text-sm overflow-hidden flex-shrink-0">
                                            {sub.user?.avatarUrl ? (
                                                <img src={sub.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                (sub.user?.fullName?.[0] || 'U').toUpperCase()
                                            )}
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h3 className="font-black text-slate-900 text-sm">{sub.user?.fullName}</h3>
                                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wide border ${statusConfig.color}`}>
                                                    <StatusIcon className="w-2.5 h-2.5 inline mr-1" />
                                                    {statusConfig.label}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                                                <span>{sub.user?.email}</span>
                                                <span>·</span>
                                                <code className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold">{sub.referralCode}</code>
                                            </div>
                                            {sub.kycSubmittedAt && (
                                                <p className="text-[10px] text-slate-400 mt-1 font-medium">
                                                    Submitted {formatDistanceToNow(new Date(sub.kycSubmittedAt), { addSuffix: true })}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {sub.kycDocumentUrl && (
                                            <a
                                                href={sub.kycDocumentUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
                                            >
                                                <FileText className="w-3.5 h-3.5" /> View Document <ExternalLink className="w-3 h-3" />
                                            </a>
                                        )}
                                        {sub.kycStatus === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleReview(sub.id, 'approved')}
                                                    disabled={actionLoading === sub.id}
                                                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wide hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-sm"
                                                >
                                                    {actionLoading === sub.id ? (
                                                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    ) : (
                                                        <><CheckCircle className="w-3.5 h-3.5" /> Approve</>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleReview(sub.id, 'rejected')}
                                                    disabled={actionLoading === sub.id}
                                                    className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-black uppercase tracking-wide hover:bg-red-100 transition-all disabled:opacity-50"
                                                >
                                                    <XCircle className="w-3.5 h-3.5" /> Reject
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
