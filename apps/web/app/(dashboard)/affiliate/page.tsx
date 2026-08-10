"use client";

import React, { useState, useEffect } from 'react';
import {
    Users, Wallet, Link as LinkIcon,
    CheckCircle2, Copy, Share2, ArrowRight,
    Gift, Timer, AlertCircle, Loader2,
    Coins, Clock, Hourglass, Ban, CircleDollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    pending_approval: { label: 'Awaiting Approval', color: 'text-amber-600', bg: 'bg-amber-100', icon: Hourglass },
    converted: { label: 'Approved', color: 'text-emerald-600', bg: 'bg-emerald-100', icon: CheckCircle2 },
    cancelled: { label: 'Rejected', color: 'text-red-600', bg: 'bg-red-100', icon: Ban },
};

export default function AffiliateDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [earnings, setEarnings] = useState<any>(null);
    const [referrals, setReferrals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: 'success' | 'error' } | null>(null);

    const showAlert = (title: string, message: string, type: 'success' | 'error' = 'error') => {
        setAlertConfig({ title, message, type });
    };

    useEffect(() => {
        setIsMounted(true);
        if (user) loadData();
    }, [user]);

    const loadData = async () => {
        try {
            const [statsData, earningsData, refData] = await Promise.all([
                api.affiliate.getStats(),
                api.affiliate.getEarningsBreakdown().catch(() => null),
                api.affiliate.getReferrals(),
            ]);
            setStats(statsData);
            setEarnings(earningsData);
            setReferrals(refData as any[]);
        } catch (err) {
            console.error('Failed to load affiliate data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        setJoining(true);
        try {
            await api.affiliate.join({});
            await loadData();
            showAlert('Success', 'Successfully joined the affiliate program!', 'success');
        } catch (err: any) {
            showAlert('Error', err.message || 'Failed to join affiliate program', 'error');
        } finally {
            setJoining(false);
        }
    };

    const copyCode = () => {
        if (!isMounted || !stats?.referralCode) return;
        navigator.clipboard.writeText(stats.referralCode);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const copyReferralLink = () => {
        if (!isMounted || !stats?.referralCode) return;
        const link = `${window.location.origin}/register?ref=${stats.referralCode}`;
        navigator.clipboard.writeText(link);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const commissionReferrals = referrals.filter(r => r.status === 'pending_approval' || r.status === 'converted' || r.status === 'cancelled');
    const pendingCommissions = referrals.filter(r => r.status === 'pending_approval');
    const approvedCommissions = referrals.filter(r => r.status === 'converted');
    const totalPendingCredits = pendingCommissions.reduce((sum, r) => sum + (Number(r.commissionAmount) || 0), 0);
    const totalApprovedCredits = approvedCommissions.reduce((sum, r) => sum + (Number(r.commissionAmount) || 0), 0);

    if (loading && user) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
        );
    }

    if ((!stats || stats.isAffiliate === false) && !loading) {
        return (
            <main className="max-w-4xl mx-auto px-4 py-20 text-center">
                <div className="w-24 h-24 bg-orange-50 rounded-[28px] flex items-center justify-center mx-auto mb-8">
                    <Gift className="w-12 h-12 text-orange-500" />
                </div>
                <h1 className="text-4xl font-black text-slate-900 mb-4">Join Our Affiliate Program</h1>
                <p className="text-slate-500 text-lg mb-10 max-w-2xl mx-auto font-medium">
                    Share your referral code. When someone purchases a plan, you earn commission!
                </p>
                <button
                    onClick={handleJoin}
                    disabled={joining}
                    className="px-12 py-5 bg-slate-900 text-white rounded-3xl font-black text-lg hover:bg-orange-500 transition-all active:scale-95 flex items-center gap-3 mx-auto shadow-xl shadow-slate-200"
                >
                    {joining ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Start Earning Now <ArrowRight className="w-5 h-5" /></>}
                </button>
            </main>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest">Affiliate Program</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: {stats?.referralCode}</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900">Affiliate Dashboard</h1>
                </div>
            </div>

            {/* Referral Code Card */}
            <div className="mb-8 p-6 bg-gradient-to-r from-slate-900 to-slate-800 rounded-[28px] text-white">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Your Referral Code</p>
                        <div className="flex items-center gap-4">
                            <span className="text-3xl font-black tracking-[0.3em]">{isMounted && stats?.referralCode ? stats.referralCode : 'Loading...'}</span>
                            <button
                                onClick={copyCode}
                                className="px-4 py-2 bg-white/10 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-2"
                            >
                                {copySuccess ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copySuccess ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Referral Link</p>
                        <button
                            onClick={copyReferralLink}
                            className="px-5 py-2.5 bg-orange-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition-all flex items-center gap-2"
                        >
                            <LinkIcon className="w-4 h-4" /> Copy Link
                        </button>
                    </div>
                </div>
            </div>

            {/* Earnings Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="p-6 bg-white rounded-[24px] border border-slate-200 shadow-sm">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 mb-4">
                        <Coins className="w-5 h-5" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Earned</p>
                    <p className="text-2xl font-black text-slate-900">Credits {Number(earnings?.totalEarned || stats?.totalEarnings || 0).toFixed(2)}</p>
                </div>
                <div className="p-6 bg-white rounded-[24px] border border-slate-200 shadow-sm">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 mb-4">
                        <Wallet className="w-5 h-5" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Balance</p>
                    <p className="text-2xl font-black text-slate-900">Credits {Number(earnings?.balance || stats?.balance || 0).toFixed(2)}</p>
                </div>
                <div className="p-6 bg-white rounded-[24px] border border-slate-200 shadow-sm">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 mb-4">
                        <Hourglass className="w-5 h-5" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Commission</p>
                    <p className="text-2xl font-black text-slate-900">Credits {totalPendingCredits.toFixed(2)}</p>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <div className="p-5 bg-white rounded-[20px] border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                        <Hourglass className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Awaiting Approval</p>
                        <p className="text-xl font-black text-slate-900">{pendingCommissions.length}</p>
                    </div>
                </div>
                <div className="p-5 bg-white rounded-[20px] border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Approved</p>
                        <p className="text-xl font-black text-slate-900">{approvedCommissions.length}</p>
                    </div>
                </div>
                <div className="p-5 bg-white rounded-[20px] border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center text-violet-500">
                        <Coins className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Earned Credits</p>
                        <p className="text-xl font-black text-slate-900">{totalApprovedCredits.toFixed(0)}</p>
                    </div>
                </div>
            </div>

            {/* Commission Requests */}
            <div className="bg-white rounded-[28px] border border-slate-200 overflow-hidden">
                <div className="p-8 border-b border-slate-100">
                    <h3 className="text-xl font-black text-slate-900">Commission Requests</h3>
                    <p className="text-sm text-slate-500 mt-1">When someone you referred buys a plan, a commission request goes to admin for approval</p>
                </div>
                <div className="p-4">
                    {commissionReferrals.length > 0 ? (
                        <div className="space-y-2">
                            {commissionReferrals.map((ref, idx) => {
                                const statusInfo = STATUS_CONFIG[ref.status] || STATUS_CONFIG.pending_approval;
                                const StatusIcon = statusInfo.icon;
                                return (
                                    <div key={idx} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${statusInfo.bg} ${statusInfo.color}`}>
                                                <StatusIcon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-slate-900">{ref.referredUser?.fullName || 'User'}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                    {new Date(ref.createdAt).toLocaleDateString()} · {ref.type === 'subscription' ? 'Plan Purchase' : 'Referral'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-lg font-black text-slate-900">{Number(ref.commissionAmount || 0).toFixed(0)} Credits</p>
                                                <p className="text-[10px] font-bold text-slate-400">Commission</p>
                                            </div>
                                            <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${statusInfo.bg} ${statusInfo.color}`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {statusInfo.label}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-20 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                <CircleDollarSign className="w-8 h-8 text-slate-200" />
                            </div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No commission requests yet</p>
                            <p className="text-xs text-slate-400 mt-2">Commissions appear when your referrals purchase a plan</p>
                        </div>
                    )}
                </div>
            </div>

            {/* How Commission Works */}
            <div className="mt-8 p-8 bg-slate-900 rounded-[28px] text-white">
                <h3 className="text-xl font-black mb-6">How Commission Works</h3>
                <div className="grid md:grid-cols-4 gap-6">
                    <div className="flex gap-4">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-orange-400 shrink-0">1</div>
                        <p className="text-sm text-slate-300 font-medium">Share your code. When someone signs up, a referral is created.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-blue-400 shrink-0">2</div>
                        <p className="text-sm text-slate-300 font-medium">When they <span className="text-white font-black">purchase a plan</span>, a commission request is sent to admin.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-amber-400 shrink-0">3</div>
                        <p className="text-sm text-slate-300 font-medium">Admin <span className="text-white font-black">approves</span> the commission request from the admin panel.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-emerald-400 shrink-0">4</div>
                        <p className="text-sm text-slate-300 font-medium">Approved credits are <span className="text-white font-black">added to your balance</span> instantly!</p>
                    </div>
                </div>
            </div>

            {/* Alert Modal */}
            <AnimatePresence>
                {alertConfig && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setAlertConfig(null)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-sm bg-white rounded-[24px] shadow-2xl overflow-hidden p-8 text-center"
                        >
                            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6 ${alertConfig.type === 'success' ? 'bg-emerald-100 text-emerald-500' : 'bg-red-100 text-red-500'}`}>
                                {alertConfig.type === 'success' ? <CheckCircle2 className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">{alertConfig.title}</h3>
                            <p className="text-slate-500 font-medium mb-8">{alertConfig.message}</p>
                            <button
                                onClick={() => setAlertConfig(null)}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all active:scale-[0.98]"
                            >
                                Okay
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
