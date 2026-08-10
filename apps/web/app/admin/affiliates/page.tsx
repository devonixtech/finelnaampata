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
    Settings,
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
        <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 flex flex-col gap-3 sm:gap-4 shadow-sm h-full">
            <div className={`w-10 h-10 sm:w-11 sm:h-11 ${color} rounded-xl flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 sm:w-5 sm:h-5 ${textColor}`} />
            </div>
            <div className="flex flex-col mt-auto">
                <p className="text-xl sm:text-2xl font-black text-slate-900 leading-tight break-words">{value}</p>
                <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1 leading-snug">{label}</p>
            </div>
        </div>
    );
}

function KebabMenu({ affiliate, onSuspend }: {
    affiliate: Affiliate;
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
                    <button
                        onClick={() => { onSuspend(affiliate.id); setOpen(false); }}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                    >
                        <Ban className="w-4 h-4" /> Suspend Affiliate
                    </button>
                </div>
            )}
        </div>
    );
}

interface AdminAffiliateStats {
    totalAffiliates: number;
    activeAffiliates: number;
    totalEarnings: number;
    totalPaidOut: number;
    totalCommissionOwed: number;
    pendingPayouts: number;
    totalClicks: number;
    totalRevenueGenerated: number;
}

export default function AffiliatesAdminPage() {
    const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
    const [referrals, setReferrals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [activeTab, setActiveTab] = useState('affiliates');

    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [stats, setStats] = useState<AdminAffiliateStats | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [settingsForm, setSettingsForm] = useState({ commissionRate: '35', creditValue: '1' });
    const [savingSettings, setSavingSettings] = useState(false);

    const fetchAffiliates = useCallback(async () => {
        setLoading(true);
        try {
            const [affiliatesData, statsData, referralsData] = await Promise.all([
                api.admin.affiliate.getAffiliates(),
                api.admin.affiliate.getStats(),
                api.admin.affiliate.getReferrals()
            ]);
            setAffiliates(affiliatesData || []);
            setStats(statsData);
            setReferrals(referralsData || []);
        } catch (err) {
            console.error('Failed to fetch affiliates:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAffiliates(); }, [fetchAffiliates]);

    const openSettings = async () => {
        setShowSettings(true);
        try {
            const data = await api.admin.affiliate.getSettings();
            setSettingsForm({
                commissionRate: data?.affiliate_commission_rate || '35',
                creditValue: data?.affiliate_credit_value || '1'
            });
        } catch (err) {
            console.error('Failed to load settings', err);
        }
    };

    const saveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingSettings(true);
        try {
            await api.admin.affiliate.updateSettings({
                commissionRate: settingsForm.commissionRate,
                commissionType: 'percentage',
                checkinReward: '0',
                checkinType: 'fixed',
                validityMonths: '12',
                expiryDate: '',
                creditValue: settingsForm.creditValue
            });
            setShowSettings(false);
            // Show toast/alert here if available
        } catch (err) {
            console.error('Failed to save settings', err);
        } finally {
            setSavingSettings(false);
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
            (statusFilter === 'active' && !a.isSuspended) ||
            (statusFilter === 'suspended' && a.isSuspended);
        return matchesSearch && matchesStatus;
    });

    const handleApproveCommission = async (id: string) => {
        setActionLoading(id);
        try {
            await api.admin.affiliate.approveCommission(id);
            setReferrals(prev => prev.map(r => r.id === id ? { ...r, status: 'converted' } : r));
            // Refetch to update affiliate balances
            fetchAffiliates();
        } catch (err) {
            console.error('Approve failed:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusBadge = (affiliate: Affiliate) => {
        if (affiliate.isSuspended) return { label: 'Suspended', color: 'bg-red-50 text-red-600 border-red-100' };
        return { label: 'Active', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
    };

    return (
        <div className="space-y-7 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-1">
                        Affiliate <span className="bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">Management</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-sm">Manage affiliates and payouts.</p>
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

            </div>

            {/* Main Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('affiliates')}
                    className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${
                        activeTab === 'affiliates'
                            ? 'border-emerald-500 text-emerald-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                >
                    Affiliate Management
                </button>
                <button
                    onClick={() => setActiveTab('commissions')}
                    className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all ${
                        activeTab === 'commissions'
                            ? 'border-emerald-500 text-emerald-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                >
                    Pending Commissions
                    {referrals.filter(r => r.status === 'pending_approval').length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-black">
                            {referrals.filter(r => r.status === 'pending_approval').length}
                        </span>
                    )}
                </button>
            </div>

            {activeTab === 'affiliates' ? (
                <>
            {/* Quick Links & Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                    {[
                        { id: 'all', label: 'All Affiliates' },
                        { id: 'active', label: 'Active' },
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
                    <button
                        onClick={openSettings}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <Settings className="w-4 h-4 text-emerald-500" /> Affiliate Settings
                    </button>
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
            </>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                                    <th className="px-6 py-4">Affiliate</th>
                                    <th className="px-6 py-4">Referred User</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4 text-right">Commission (Credits)</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading...</td>
                                    </tr>
                                ) : referrals.filter(r => r.status === 'pending_approval').length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center">
                                            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                                            <p className="font-bold text-slate-900">All caught up!</p>
                                            <p className="text-xs text-slate-400">No pending commissions to approve.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    referrals.filter(r => r.status === 'pending_approval').map(ref => (
                                        <tr key={ref.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-900">{ref.affiliate?.user?.fullName || 'Unknown'}</p>
                                                <p className="text-xs text-slate-500">{ref.affiliate?.user?.email || 'N/A'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-700">{ref.referredUser?.fullName || 'Unknown'}</p>
                                                <p className="text-xs text-slate-400">ID: {ref.referredUser?.id?.slice(0, 8)}...</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border bg-blue-50 text-blue-600 border-blue-100">
                                                    {ref.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-medium text-slate-600">{new Date(ref.createdAt).toLocaleDateString()}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm font-black text-emerald-600">+{ref.commissionAmount} Credits</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleApproveCommission(ref.id)}
                                                    disabled={actionLoading === ref.id}
                                                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center ml-auto gap-2"
                                                >
                                                    {actionLoading === ref.id ? (
                                                        <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                                                    ) : (
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                    )}
                                                    Approve
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        {/* Settings Modal */}
        {showSettings && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                    <div className="flex items-center justify-between p-6 border-b border-slate-100">
                        <h2 className="text-xl font-black text-slate-900">Affiliate Settings</h2>
                        <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                            <XCircle className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>
                    <form onSubmit={saveSettings} className="p-6 space-y-6">
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Commission Rate (%)</label>
                            <input
                                type="number"
                                value={settingsForm.commissionRate}
                                onChange={(e) => setSettingsForm(prev => ({ ...prev, commissionRate: e.target.value }))}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">1 Credit = Rs. ?</label>
                            <input
                                type="number"
                                value={settingsForm.creditValue}
                                onChange={(e) => setSettingsForm(prev => ({ ...prev, creditValue: e.target.value }))}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold"
                                required
                            />
                        </div>
                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowSettings(false)}
                                className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold hover:bg-slate-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={savingSettings}
                                className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 disabled:opacity-50"
                            >
                                {savingSettings ? 'Saving...' : 'Save Settings'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
        </div>
    );
}
