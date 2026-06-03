"use client";

import React, { useState, useEffect } from 'react';
import { 
    Users, 
    Link as LinkIcon, 
    CheckCircle, 
    Clock, 
    ArrowRight,
    Search,
    Filter,
    ShieldCheck,
    AlertCircle,
    UserCircle,
    Gift,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { api } from '../../../lib/api';
import StatsGrid from '../../../components/business/StatsGrid';

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

    const handleActivate = async (id: string) => {
        if (!confirm('Are you sure you want to manually activate this referral and grant the extension to the referrer?')) return;
        
        setActionId(id);
        try {
            const result = await api.admin.affiliate.activateReferral(id);
            if (result.success) {
                alert(result.message);
                await fetchData();
            } else {
                alert('Failed to activate: ' + (result.reason || 'Unknown error'));
            }
        } catch (err: any) {
            console.error('Activation failed:', err);
            alert('Activation error: ' + err.message);
        } finally {
            setActionId(null);
        }
    };

    const filteredReferrals = referrals.filter(ref => {
        const matchesSearch = 
            ref.affiliate?.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ref.referredUser?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ref.affiliate?.referralCode?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || ref.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    const stats = [
        {
            label: 'Total Referrals',
            value: referrals.length.toString(),
            icon: LinkIcon,
            color: 'bg-slate-900',
            shadow: 'shadow-slate-500/20'
        },
        {
            label: 'Converted',
            value: referrals.filter(r => r.status === 'converted').length.toString(),
            icon: CheckCircle,
            color: 'bg-emerald-500',
            shadow: 'shadow-emerald-500/20'
        },
        {
            label: 'Pending Activation',
            value: referrals.filter(r => r.status === 'pending').length.toString(),
            icon: Clock,
            color: 'bg-amber-500',
            shadow: 'shadow-amber-500/20'
        }
    ];

    return (
        <div className="space-y-10 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-2">Referral History</h1>
                    <p className="text-slate-400 font-bold tracking-tight">Status of referrers and referred businesses</p>
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
                    
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-6 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-black text-slate-600 focus:ring-2 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all cursor-pointer"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="converted">Converted</option>
                    </select>
                </div>
            </div>

            {/* Stats */}
            <StatsGrid stats={stats} />

            {/* Referrals Table */}
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                                <th className="px-8 py-5">Referrer (Affiliate)</th>
                                <th className="px-8 py-5">Referred User</th>
                                <th className="px-8 py-5">Type</th>
                                <th className="px-8 py-5">Status</th>
                                <th className="px-8 py-5">Date</th>
                                <th className="px-8 py-5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-8 py-6 h-20 bg-slate-50/20"></td>
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
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${
                                                    ref.status === 'converted' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                                                }`} />
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${
                                                    ref.status === 'converted' ? 'text-emerald-600' : 'text-amber-600'
                                                }`}>
                                                    {ref.status === 'converted' ? 'Earned' : 'Awaiting Activation'}
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
                                            {ref.status === 'pending' ? (
                                                <button
                                                    onClick={() => handleActivate(ref.id)}
                                                    disabled={!!actionId}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-xl hover:shadow-red-500/20 active:scale-95 disabled:opacity-50 transition-all"
                                                >
                                                    {actionId === ref.id ? (
                                                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    ) : (
                                                        <>Activate Reward <ArrowRight className="w-3 h-3" /></>
                                                    )}
                                                </button>
                                            ) : (
                                                <div className="inline-flex items-center gap-2 text-emerald-500">
                                                    <ShieldCheck className="w-5 h-5" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Bonus Granted</span>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <AlertCircle className="w-8 h-8 text-slate-200" />
                                        </div>
                                        <h3 className="text-slate-900 font-bold">No referrals found</h3>
                                        <p className="text-slate-400 text-xs mt-1">Try adjusting your filters or search query.</p>
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

