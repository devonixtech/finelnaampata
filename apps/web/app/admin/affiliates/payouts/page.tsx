"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    DollarSign,
    Search,
    CheckCircle,
    XCircle,
    Clock,
    ChevronLeft,
    RefreshCcw,
    CreditCard,
    AlertTriangle,
    ExternalLink,
    Banknote,
    User as UserIcon,
    ArrowRight,
} from 'lucide-react';
import { api } from '../../../../lib/api';
import { formatDistanceToNow } from 'date-fns';
import { SearchableSelect } from '../../../../components/ui/SearchableSelect';
import { toast } from "react-hot-toast";

interface Payout {
    id: string;
    amount: number;
    method: string;
    details: string;
    paymentReference?: string;
    status: 'pending' | 'approved' | 'paid' | 'rejected';
    createdAt: string;
    processedAt?: string;
    affiliate: {
        id: string;
        referralCode: string;
        user: {
            id: string;
            fullName: string;
            email?: string;
        };
    };
}

export default function PayoutsAdminPage() {
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('pending');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [paymentRefInputs, setPaymentRefInputs] = useState<Record<string, string>>({});

    const fetchPayouts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.admin.affiliate.getPayouts();
            setPayouts(data || []);
        } catch (err) {
            console.error('Failed to fetch payouts:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchPayouts(); }, [fetchPayouts]);

    const handleApprove = async (id: string) => {
        setActionLoading(id);
        try {
            await api.admin.affiliate.approvePayout(id);
            setPayouts(prev => prev.map(p => p.id === id ? { ...p, status: 'approved' as const } : p));
        } catch (err) {
            console.error('Approval failed:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm('Reject this payout request?')) return;
        setActionLoading(id);
        try {
            await api.admin.affiliate.rejectPayout(id, 'Rejected by admin');
            setPayouts(prev => prev.map(p => p.id === id ? { ...p, status: 'rejected' as const } : p));
        } catch (err) {
            console.error('Rejection failed:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleMarkAsPaid = async (id: string) => {
        const ref = paymentRefInputs[id];
        if (!ref?.trim()) {
            toast.error('Please enter a payment reference before marking as paid.');
            return;
        }
        setActionLoading(id);
        try {
            await api.admin.affiliate.markAsPaid(id, ref.trim());
            setPayouts(prev => prev.map(p => p.id === id ? { ...p, status: 'paid' as const, paymentReference: ref.trim() } : p));
            setPaymentRefInputs(prev => { const n = { ...prev }; delete n[id]; return n; });
        } catch (err) {
            console.error('Mark as paid failed:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const filtered = payouts.filter(p => {
        const matchesSearch = !search ||
            p.affiliate?.user?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
            p.affiliate?.referralCode?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const pendingCount = payouts.filter(p => p.status === 'pending').length;
    const approvedCount = payouts.filter(p => p.status === 'approved').length;
    const paidCount = payouts.filter(p => p.status === 'paid').length;
    const rejectedCount = payouts.filter(p => p.status === 'rejected').length;
    const totalPending = payouts.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'paid': return { color: 'bg-emerald-50 text-emerald-700 border-emerald-100', label: 'Paid' };
            case 'approved': return { color: 'bg-blue-50 text-blue-600 border-blue-100', label: 'Approved' };
            case 'pending': return { color: 'bg-amber-50 text-amber-600 border-amber-100', label: 'Pending' };
            case 'rejected': return { color: 'bg-red-50 text-red-600 border-red-100', label: 'Rejected' };
            default: return { color: 'bg-slate-50 text-slate-400 border-slate-200', label: status };
        }
    };

    const getMethodIcon = (method: string) => {
        if (method?.toLowerCase().includes('bank')) return CreditCard;
        if (method?.toLowerCase().includes('paypal')) return ExternalLink;
        return Banknote;
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
                        Payout <span className="bg-gradient-to-r from-emerald-500 to-green-500 bg-clip-text text-transparent">Queue</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-sm">Review, approve, and process affiliate payout requests.</p>
                </div>
                <button
                    onClick={fetchPayouts}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50 self-start"
                >
                    <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Pending', value: pendingCount, sub: `Rs. ${(Number(totalPending) || 0).toFixed(2)}`, color: 'bg-amber-100', textColor: 'text-amber-600', filterVal: 'pending' },
                    { label: 'Approved', value: approvedCount, color: 'bg-blue-100', textColor: 'text-blue-600', filterVal: 'approved' },
                    { label: 'Paid', value: paidCount, color: 'bg-emerald-100', textColor: 'text-emerald-600', filterVal: 'paid' },
                    { label: 'Rejected', value: rejectedCount, color: 'bg-red-100', textColor: 'text-red-500', filterVal: 'rejected' },
                ].map(stat => (
                    <button
                        key={stat.filterVal}
                        onClick={() => setStatusFilter(stat.filterVal)}
                        className={`rounded-2xl border p-5 flex items-center gap-4 shadow-sm transition-all text-left ${statusFilter === stat.filterVal ? 'ring-2 ring-slate-500/20 border-slate-300' : 'border-slate-100 bg-white'}`}
                    >
                        <div className={`w-11 h-11 ${stat.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                            <DollarSign className={`w-5 h-5 ${stat.textColor}`} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900 leading-none">{stat.value}</p>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{stat.label}</p>
                            {stat.sub && <p className="text-[10px] font-bold text-amber-500 mt-0.5">{stat.sub}</p>}
                        </div>
                    </button>
                ))}
            </div>

            {/* Search + filter */}
            <div className="bg-white border border-slate-100 rounded-2xl p-3.5 shadow-sm flex flex-wrap items-center gap-3">
                <div className="relative flex-grow min-w-[180px]">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search by name or code..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                    />
                </div>
                <div className="w-40">
                    <SearchableSelect
                        value={statusFilter}
                        onChange={val => setStatusFilter(val)}
                        options={[
                            { label: 'All Status', value: 'all' },
                            { label: '⏳ Pending', value: 'pending' },
                            { label: '✓ Approved', value: 'approved' },
                            { label: '💰 Paid', value: 'paid' },
                            { label: '✗ Rejected', value: 'rejected' },
                        ]}
                    />
                </div>
                <span className="ml-auto text-xs font-bold text-slate-400">{filtered.length} of {payouts.length}</span>
            </div>

            {/* Payout Cards */}
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
                            <DollarSign className="w-7 h-7 text-slate-200" />
                        </div>
                        <p className="font-bold text-slate-900">No payout requests</p>
                        <p className="text-xs text-slate-400">Nothing matches the current filter.</p>
                    </div>
                ) : (
                    filtered.map(payout => {
                        const statusConfig = getStatusConfig(payout.status);
                        const MethodIcon = getMethodIcon(payout.method);
                        return (
                            <div
                                key={payout.id}
                                className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                    {/* Info */}
                                    <div className="flex items-center gap-4 flex-grow min-w-0">
                                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                                            <MethodIcon className="w-5 h-5 text-slate-500" />
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                                <h3 className="font-black text-slate-900 text-sm">{payout.affiliate?.user?.fullName}</h3>
                                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wide border ${statusConfig.color}`}>
                                                    {statusConfig.label}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-slate-400 font-medium flex-wrap">
                                                <span className="font-black text-slate-900 text-lg">Rs. {(Number(payout.amount) || 0).toFixed(2)}</span>
                                                <span>·</span>
                                                <span>{payout.method}</span>
                                                <span>·</span>
                                                <code className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold">{payout.affiliate?.referralCode}</code>
                                            </div>
                                            {payout.details && (
                                                <p className="text-[11px] text-slate-500 mt-1 font-medium truncate">{payout.details}</p>
                                            )}
                                            {payout.paymentReference && (
                                                <p className="text-[10px] text-emerald-600 mt-1 font-bold">Ref: {payout.paymentReference}</p>
                                            )}
                                            <p className="text-[10px] text-slate-400 mt-1 font-medium">
                                                Requested {formatDistanceToNow(new Date(payout.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                                        {payout.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleApprove(payout.id)}
                                                    disabled={actionLoading === payout.id}
                                                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wide hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-sm"
                                                >
                                                    {actionLoading === payout.id ? (
                                                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    ) : (
                                                        <><CheckCircle className="w-3.5 h-3.5" /> Approve</>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleReject(payout.id)}
                                                    disabled={actionLoading === payout.id}
                                                    className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-black uppercase tracking-wide hover:bg-red-100 transition-all disabled:opacity-50"
                                                >
                                                    <XCircle className="w-3.5 h-3.5" /> Reject
                                                </button>
                                            </>
                                        )}
                                        {payout.status === 'approved' && (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Payment reference"
                                                    value={paymentRefInputs[payout.id] || ''}
                                                    onChange={e => setPaymentRefInputs(prev => ({ ...prev, [payout.id]: e.target.value }))}
                                                    className="w-40 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                                />
                                                <button
                                                    onClick={() => handleMarkAsPaid(payout.id)}
                                                    disabled={actionLoading === payout.id || !paymentRefInputs[payout.id]?.trim()}
                                                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wide hover:bg-slate-700 transition-all disabled:opacity-50 shadow-sm"
                                                >
                                                    {actionLoading === payout.id ? (
                                                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    ) : (
                                                        <><Banknote className="w-3.5 h-3.5" /> Mark as Paid</>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                        {payout.status === 'paid' && (
                                            <div className="flex items-center gap-2 text-emerald-600">
                                                <CheckCircle className="w-4 h-4" />
                                                <span className="text-xs font-black uppercase tracking-wide">Completed</span>
                                            </div>
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
