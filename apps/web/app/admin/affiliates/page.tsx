"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    Users,
    Search,
    CheckCircle,
    XCircle,
    ShieldCheck,
    AlertTriangle,
    TrendingUp,
    DollarSign,
    Eye,
    Ban,
    ChevronDown,
    ExternalLink,
    RefreshCcw,
    MoreVertical,
    User as UserIcon,
    Star,
    Clock,
    ArrowUpRight,
    Download,
} from 'lucide-react';
import { api } from '../../../lib/api';
import { formatDistanceToNow } from 'date-fns';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';

interface Affiliate {
    id: string;
    referralCode: string;
    commissionRate: number;
    totalEarnings: number;
    balanceHeld: number;
    paidOut: number;
    isActive: boolean;
    isSuspended: boolean;
    kycStatus: 'none' | 'pending' | 'approved' | 'rejected';
    adminApproved: boolean;
    address?: string;
    nicNumber?: string;
    createdAt: string;
    user: {
        id: string;
        fullName: string;
        email?: string;
        avatarUrl?: string;
    };
    _count?: {
        referrals: number;
    };
}

function StatCard({ label, value, icon: Icon, color, textColor }: {
    label: string; value: number | string; icon: any; color: string; textColor: string;
}) {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 flex items-center gap-3 sm:gap-4 shadow-sm h-full overflow-hidden">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 ${color} rounded-xl flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${textColor}`} />
            </div>
            <div className="flex flex-col min-w-0 justify-center">
                <p className="text-lg sm:text-xl lg:text-2xl font-black text-slate-900 leading-tight truncate">{value}</p>
                <p className="text-[9px] sm:text-[10px] lg:text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 sm:mt-1 leading-snug line-clamp-2">{label}</p>
            </div>
        </div>
    );
}

function KebabMenu({ affiliate, onApprove, onSuspend }: {
    affiliate: Affiliate;
    onApprove: (id: string) => void;
    onSuspend: (id: string) => void;
}) {
    const [open, setOpen] = useState(false);

    return (
        <div className="relative flex-shrink-0">
            <button
                onClick={() => setOpen(v => !v)}
                className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all duration-150 ${open
                        ? 'bg-slate-900 border-slate-900 text-white shadow-lg'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                    }`}
            >
                <MoreVertical className="w-4 h-4" />
            </button>
            {open && (
                <div className="absolute right-0 top-[calc(100%+6px)] w-52 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[9999] overflow-hidden">
                    <Link
                        href={`/admin/affiliates/kyc`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                    >
                        <ShieldCheck className="w-4 h-4" /> View KYC Status
                    </Link>
                    {!affiliate.adminApproved ? (
                        <button
                            onClick={() => { onApprove(affiliate.id); setOpen(false); }}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-50 transition-colors w-full text-left"
                        >
                            <CheckCircle className="w-4 h-4" /> Approve Affiliate
                        </button>
                    ) : (
                        <button
                            onClick={() => { onSuspend(affiliate.id); setOpen(false); }}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                        >
                            <Ban className="w-4 h-4" /> Suspend Affiliate
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

interface AdminAffiliateStats {
    totalAffiliates: number;
    activeAffiliates: number;
    pendingApprovals: number;
    totalEarnings: number;
    totalPaidOut: number;
    totalCommissionOwed: number;
    pendingPayouts: number;
    totalClicks: number;
    totalRevenueGenerated: number;
}

export default function AffiliatesAdminPage() {
    const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [kycFilter, setKycFilter] = useState('all');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [stats, setStats] = useState<AdminAffiliateStats | null>(null);

    const fetchAffiliates = useCallback(async () => {
        setLoading(true);
        try {
            const [affiliatesData, statsData] = await Promise.all([
                api.admin.affiliate.getAffiliates(),
                api.admin.affiliate.getStats(),
            ]);
            setAffiliates(affiliatesData || []);
            setStats(statsData);
        } catch (err) {
            console.error('Failed to fetch affiliates:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAffiliates(); }, [fetchAffiliates]);

    const handleApprove = async (id: string) => {
        setActionLoading(id);
        try {
            await api.admin.affiliate.approveAffiliate(id);
            setAffiliates(prev => prev.map(a => a.id === id ? { ...a, adminApproved: true } : a));
        } catch (err) {
            console.error('Approval failed:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleSuspend = async (id: string) => {
        setActionLoading(id);
        try {
            await api.admin.affiliate.suspendAffiliate(id);
            setAffiliates(prev => prev.map(a => a.id === id ? { ...a, isSuspended: true } : a));
        } catch (err) {
            console.error('Suspension failed:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleExport = async (format: 'csv' | 'json') => {
        try {
            const data = await api.admin.affiliate.exportAffiliates(format);
            const blob = new Blob([typeof data === 'string' ? data : JSON.stringify(data, null, 2)], {
                type: format === 'csv' ? 'text/csv' : 'application/json'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `affiliates.${format}`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export failed:', err);
        }
    };

    const handleExportPayouts = async () => {
        try {
            const data = await api.admin.affiliate.exportPayoutReports('csv');
            const blob = new Blob([typeof data === 'string' ? data : JSON.stringify(data, null, 2)], {
                type: 'text/csv'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `payout-reports.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export payouts failed:', err);
        }
    };

    const filtered = affiliates.filter(a => {
        const matchesSearch = !search ||
            a.user?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
            a.referralCode?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && a.adminApproved && !a.isSuspended) ||
            (statusFilter === 'pending' && !a.adminApproved) ||
            (statusFilter === 'suspended' && a.isSuspended);
        const matchesKyc = kycFilter === 'all' ||
            (kycFilter === 'none' && a.kycStatus === 'none') ||
            (kycFilter === 'pending' && a.kycStatus === 'pending') ||
            (kycFilter === 'approved' && a.kycStatus === 'approved') ||
            (kycFilter === 'rejected' && a.kycStatus === 'rejected');
        return matchesSearch && matchesStatus && matchesKyc;
    });

    const pendingKyc = affiliates.filter(a => a.kycStatus === 'pending').length;

    const getKycBadge = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'rejected': return 'bg-red-50 text-red-600 border-red-100';
            case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
            default: return 'bg-slate-50 text-slate-400 border-slate-200';
        }
    };

    const getStatusBadge = (affiliate: Affiliate) => {
        if (affiliate.isSuspended) return { label: 'Suspended', color: 'bg-red-50 text-red-600 border-red-100' };
        if (affiliate.adminApproved) return { label: 'Active', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
        return { label: 'Pending', color: 'bg-amber-50 text-amber-600 border-amber-100' };
    };

    return (
        <div className="space-y-7 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-1">
                        Affiliate <span className="bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">Management</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-sm">Manage affiliates, approvals, and payouts.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleExport('csv')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                    <button
                        onClick={handleExportPayouts}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <Download className="w-4 h-4" /> Export Payouts
                    </button>
                    <button
                        onClick={fetchAffiliates}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
                    >
                        <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <StatCard label="Total Affiliates" value={stats?.totalAffiliates ?? affiliates.length} icon={Users} color="bg-slate-100" textColor="text-slate-500" />
                <StatCard label="Active Affiliates" value={stats?.activeAffiliates ?? 0} icon={CheckCircle} color="bg-emerald-100" textColor="text-emerald-600" />
                <StatCard label="Revenue Generated" value={`Rs. ${(Number(stats?.totalRevenueGenerated) || 0).toFixed(2)}`} icon={TrendingUp} color="bg-blue-100" textColor="text-blue-600" />
                <StatCard label="Commission Owed" value={`Rs. ${(Number(stats?.totalCommissionOwed) || 0).toFixed(2)}`} icon={DollarSign} color="bg-amber-100" textColor="text-amber-600" />
                <StatCard label="Total Paid" value={`Rs. ${(Number(stats?.totalPaidOut) || 0).toFixed(2)}`} icon={DollarSign} color="bg-emerald-100" textColor="text-emerald-600" />
                <StatCard label="Pending Approvals" value={stats?.pendingApprovals ?? 0} icon={AlertTriangle} color="bg-orange-100" textColor="text-orange-600" />
            </div>

            {/* Quick Links & Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                    {[
                        { id: 'all', label: 'All Affiliates' },
                        { id: 'pending', label: 'Pending Approvals' },
                        { id: 'active', label: 'Active / Approved' },
                        { id: 'suspended', label: 'Suspended' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setStatusFilter(tab.id as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                statusFilter === tab.id
                                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                
                <div className="flex gap-3">
                    <Link
                        href="/admin/affiliates/kyc"
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <ShieldCheck className="w-4 h-4 text-amber-500" /> KYC Reviews
                        {pendingKyc > 0 && (
                            <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-black rounded-md">{pendingKyc}</span>
                        )}
                    </Link>
                    <Link
                        href="/admin/affiliates/payouts"
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <DollarSign className="w-4 h-4 text-emerald-500" /> Payout Queue
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white border border-slate-100 rounded-2xl p-3.5 shadow-sm flex flex-wrap items-center gap-3">
                <div className="relative flex-grow min-w-[180px]">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search by name or code..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all"
                    />
                </div>

                <div className="w-40">
                    <SearchableSelect
                        value={kycFilter}
                        onChange={val => setKycFilter(val)}
                        options={[
                            { label: 'All KYC', value: 'all' },
                            { label: '⏳ Pending', value: 'pending' },
                            { label: '✓ Approved', value: 'approved' },
                            { label: '✗ Rejected', value: 'rejected' },
                            { label: '— None', value: 'none' },
                        ]}
                    />
                </div>
                <span className="ml-auto text-xs font-bold text-slate-400">{filtered.length} of {affiliates.length}</span>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                                <th className="px-6 py-4">Affiliate</th>
                                <th className="px-6 py-4">Referral Code</th>
                                <th className="px-6 py-4">Address</th>
                                <th className="px-6 py-4">NIC</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">KYC</th>
                                <th className="px-6 py-4 text-right">Earnings</th>
                                <th className="px-6 py-4 text-right">Held</th>
                                <th className="px-6 py-4 text-right">Referrals</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={10} className="px-6 py-6 h-16 bg-slate-50/20" />
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-6 py-16 text-center">
                                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                            <Users className="w-7 h-7 text-slate-200" />
                                        </div>
                                        <p className="font-bold text-slate-900">No affiliates found</p>
                                        <p className="text-xs text-slate-400 mt-1">Adjust your filters or search.</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(affiliate => {
                                    const status = getStatusBadge(affiliate);
                                    return (
                                        <tr key={affiliate.id} className="group hover:bg-slate-50/30 transition-all">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 font-bold text-xs overflow-hidden">
                                                        {affiliate.user?.avatarUrl ? (
                                                            <img src={affiliate.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            (affiliate.user?.fullName?.[0] || 'U').toUpperCase()
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900">{affiliate.user?.fullName}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold">{affiliate.user?.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <code className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-700">{affiliate.referralCode}</code>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs text-slate-600">{affiliate.address || '—'}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs text-slate-600">{affiliate.nicNumber || '—'}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${status.color}`}>
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${getKycBadge(affiliate.kycStatus)}`}>
                                                    {affiliate.kycStatus}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm font-black text-slate-900">Rs. {(Number(affiliate.totalEarnings) || 0).toFixed(2)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm font-bold text-amber-600">Rs. {(Number(affiliate.balanceHeld) || 0).toFixed(2)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm font-bold text-slate-700">{affiliate._count?.referrals || 0}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <KebabMenu
                                                    affiliate={affiliate}
                                                    onApprove={handleApprove}
                                                    onSuspend={handleSuspend}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
