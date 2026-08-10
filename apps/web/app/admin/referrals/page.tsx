"use client";

import React, { useState, useEffect } from 'react';
import { 
    Users, 
    Link as LinkIcon, 
    CheckCircle, 
    Clock, 
    ArrowRight,
    Search,
    ShieldCheck,
    AlertCircle,
    UserCircle,
    Hourglass,
    Ban
} from 'lucide-react';
import { api } from '../../../lib/api';
import StatsGrid from '../../../components/business/StatsGrid';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { toast } from "react-hot-toast";

export default function AdminReferralsPage() {
    const [referrals, setReferrals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [actionId, setActionId] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await api.admin.affiliate.getReferrals();
            setReferrals(data || []);
        } catch (err) {
            console.error('Failed to fetch referrals:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleApproveCommission = async (id: string) => {
        if (!confirm('Approve this commission? Credits will be added to the affiliate balance.')) return;
        
        setActionId(id);
        try {
            const result = await api.admin.affiliate.approveCommission(id);
            if (result.success) {
                toast.success(result.message || 'Commission approved and credits added to affiliate balance');
                await fetchData();
            } else {
                toast.error('Failed to approve: ' + (result.reason || 'Unknown error'));
            }
        } catch (err: any) {
            console.error('Commission approval failed:', err);
            toast.error('Approval error: ' + err.message);
        } finally {
            setActionId(null);
        }
    };

    const handleCancelCommission = async (id: string) => {
        if (!confirm('Reject this commission? The referral will be marked as cancelled.')) return;
        
        setActionId(id);
        try {
            const result = await api.admin.affiliate.cancelCommission(id, 'Rejected by admin');
            if (result?.success) {
                toast.success(result.message || 'Commission rejected');
                await fetchData();
            } else {
                toast.error('Failed to reject commission');
            }
        } catch (err: any) {
            console.error('Commission cancel failed:', err);
            toast.error('Error: ' + err.message);
        } finally {
            setActionId(null);
        }
    };

    const filteredReferrals = referrals.filter(ref => {
        if (ref.status === 'pending') return false;
        
        const matchesSearch = 
            ref.affiliate?.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ref.referredUser?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ref.affiliate?.referralCode?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || ref.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    const commissionReferrals = referrals.filter(r => r.status !== 'pending');

    const stats = [
        {
            label: 'Awaiting Approval',
            value: referrals.filter(r => r.status === 'pending_approval').length.toString(),
            icon: Hourglass,
            color: 'bg-amber-500',
            shadow: 'shadow-amber-500/20'
        },
        {
            label: 'Approved',
            value: referrals.filter(r => r.status === 'converted').length.toString(),
            icon: CheckCircle,
            color: 'bg-emerald-500',
            shadow: 'shadow-emerald-500/20'
        },
        {
            label: 'Rejected',
            value: referrals.filter(r => r.status === 'cancelled').length.toString(),
            icon: Ban,
            color: 'bg-red-500',
            shadow: 'shadow-red-500/20'
        },
        {
            label: 'Total Credits Paid',
            value: `${referrals.filter(r => r.status === 'converted').reduce((s, r) => s + (Number(r.commissionAmount) || 0), 0).toFixed(0)}`,
            icon: LinkIcon,
            color: 'bg-slate-900',
            shadow: 'shadow-slate-500/20'
        }
    ];

    return (
        <div className="space-y-10 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-2">Commission Requests</h1>
                    <p className="text-slate-400 font-bold tracking-tight">Approve or reject commission requests from affiliate referrals</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                        <input 
                            type="text" 
                            placeholder="Search names or codes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-11 pr-6 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-600 focus:ring-2 focus:ring-red-500/10 focus:border-red-500 outline-none w-64 transition-all"
                        />
                    </div>
                    
                    <div className="w-48">
                        <SearchableSelect 
                            value={statusFilter}
                            onChange={(val) => setStatusFilter(val)}
                            options={[
                                { label: "All Status", value: "all" },
                                { label: "Awaiting Approval", value: "pending_approval" },
                                { label: "Approved", value: "converted" },
                                { label: "Rejected", value: "cancelled" }
                            ]}
                        />
                    </div>
                </div>
            </div>

            <StatsGrid stats={stats} />

            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                                <th className="px-8 py-5">Referrer (Affiliate)</th>
                                <th className="px-8 py-5">Referred User</th>
                                <th className="px-8 py-5">Type</th>
                                <th className="px-8 py-5">Commission</th>
                                <th className="px-8 py-5">Status</th>
                                <th className="px-8 py-5">Date</th>
                                <th className="px-8 py-5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={7} className="px-8 py-6 h-20 bg-slate-50/20"></td>
                                    </tr>
                                ))
                            ) : filteredReferrals.length > 0 ? (
                                filteredReferrals.map((ref) => (
                                    <tr key={ref.id} className="group hover:bg-slate-50/30 transition-all duration-300">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 font-black text-xs border border-red-100">
                                                    {ref.affiliate?.user?.fullName?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 leading-tight">
                                                        {ref.affiliate?.user?.fullName}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">
                                                        {ref.affiliate?.referralCode}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <UserCircle className="w-4 h-4 text-slate-300" />
                                                <span className="text-sm font-bold text-slate-600">{ref.referredUser?.fullName}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                                ref.type === 'subscription' 
                                                ? 'bg-blue-50 text-blue-600 border-blue-100' 
                                                : 'bg-slate-50 text-slate-400 border-slate-200'
                                            }`}>
                                                {ref.type}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-sm font-black text-slate-900">
                                                {Number(ref.commissionAmount || 0) > 0 ? `${Number(ref.commissionAmount).toFixed(0)} Credits` : '-'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${
                                                    ref.status === 'converted' ? 'bg-emerald-500' :
                                                    ref.status === 'pending_approval' ? 'bg-amber-500 animate-pulse' :
                                                    'bg-red-500'
                                                }`} />
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${
                                                    ref.status === 'converted' ? 'text-emerald-600' :
                                                    ref.status === 'pending_approval' ? 'text-amber-600' :
                                                    'text-red-600'
                                                }`}>
                                                    {ref.status === 'converted' ? 'Approved' :
                                                     ref.status === 'pending_approval' ? 'Awaiting Approval' :
                                                     'Rejected'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-[11px] font-bold text-slate-500">
                                                {new Date(ref.createdAt).toLocaleDateString(undefined, { 
                                                    year: 'numeric', 
                                                    month: 'short', 
                                                    day: 'numeric' 
                                                })}
                                            </p>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            {ref.status === 'pending_approval' ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleCancelCommission(ref.id)}
                                                        disabled={!!actionId}
                                                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 active:scale-95 disabled:opacity-50 transition-all"
                                                    >
                                                        Reject
                                                    </button>
                                                    <button
                                                        onClick={() => handleApproveCommission(ref.id)}
                                                        disabled={!!actionId}
                                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-xl hover:shadow-emerald-500/20 active:scale-95 disabled:opacity-50 transition-all"
                                                    >
                                                        {actionId === ref.id ? (
                                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        ) : (
                                                            <>Approve Commission</>
                                                        )}
                                                    </button>
                                                </div>
                                            ) : ref.status === 'cancelled' ? (
                                                <div className="inline-flex items-center gap-2 text-red-400">
                                                    <Ban className="w-4 h-4" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Rejected</span>
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-2 text-emerald-500">
                                                    <ShieldCheck className="w-5 h-5" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Approved</span>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-8 py-20 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <AlertCircle className="w-8 h-8 text-slate-200" />
                                        </div>
                                        <h3 className="text-slate-900 font-bold">No commission requests found</h3>
                                        <p className="text-slate-400 text-xs mt-1">Commissions appear when referrals purchase a plan.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
