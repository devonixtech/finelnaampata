"use client";

import React, { useState, useEffect } from 'react';
import {
    Users, TrendingUp, Wallet, Link as LinkIcon,
    CheckCircle2, Copy, Share2, ArrowRight,
    Gift, Timer, AlertCircle, ChevronRight, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';

export default function AffiliateDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [referrals, setReferrals] = useState<any[]>([]);
    const [payouts, setPayouts] = useState<any[]>([]);
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    // Payout Form State
    const [showPayoutModal, setShowPayoutModal] = useState(false);
    const [payoutAmount, setPayoutAmount] = useState('');
    const [payoutMethod, setPayoutMethod] = useState('UPI');
    const [payoutDetails, setPayoutDetails] = useState('');
    const [submittingPayout, setSubmittingPayout] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        if (user) {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        try {
            const [statsData, refData, payoutData, settingsData] = await Promise.all([
                api.affiliate.getStats(),
                api.affiliate.getReferrals(),
                api.affiliate.getPayouts(),
                api.affiliate.getSettings()
            ]);
            setStats(statsData);
            setReferrals(refData as any[]);
            setPayouts(payoutData as any[]);
            setSettings(settingsData);
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
        } catch (err: any) {
            alert(err.message || 'Failed to join affiliate program');
        } finally {
            setJoining(false);
        }
    };

    const handleRequestPayout = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(payoutAmount);

        if (isNaN(amount) || amount < 500) {
            alert('Minimum withdrawal is PKR 500');
            return;
        }

        if (amount > stats.balance) {
            alert('Insufficient balance');
            return;
        }

        if (!payoutDetails) {
            alert('Please provide payment details');
            return;
        }

        setSubmittingPayout(true);
        try {
            await api.affiliate.requestPayout({
                amount,
                method: payoutMethod,
                details: payoutDetails
            });
            setShowPayoutModal(false);
            setPayoutAmount('');
            setPayoutDetails('');
            await loadData();
            alert('Payout request submitted successfully!');
        } catch (err: any) {
            alert(err.message || 'Failed to submit payout request');
        } finally {
            setSubmittingPayout(false);
        }
    };

    const copyCode = () => {
        if (!isMounted || !stats?.referralCode) return;
        navigator.clipboard.writeText(stats.referralCode);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };


    if (loading && user) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
        );
    }
    // ... [rest of the component logic remains similar but with added UI sections]

    if ((!stats || stats.isAffiliate === false) && !loading) {
        return (
            <main className="max-w-4xl mx-auto px-4 py-20 text-center">
                    <div className="w-24 h-24 bg-orange-50 rounded-[28px] flex items-center justify-center mx-auto mb-8">
                        <Gift className="w-12 h-12 text-orange-500" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 mb-4">Join Our Affiliate Program</h1>
                    <p className="text-slate-500 text-lg mb-10 max-w-2xl mx-auto font-medium">
                        Earn rewards for every business you refer and every visit you drive. Start earning today with Punjab's leading business network.
                    </p>
                    <button
                        onClick={handleJoin}
                        disabled={joining}
                        className="px-12 py-5 bg-slate-900 text-white rounded-3xl font-black text-lg hover:bg-orange-500 transition-all active:scale-95 flex items-center gap-3 mx-auto shadow-xl shadow-slate-200"
                    >
                        {joining ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Start Earning Now <ArrowRight className="w-5 h-5" /></>}
                    </button>

                    <div className="grid md:grid-cols-3 gap-8 mt-20">
                        <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 text-left">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-500 shadow-sm mb-6">
                                <Share2 className="w-6 h-6" />
                            </div>
                            <h3 className="font-black text-slate-900 mb-2">1. Share Code</h3>
                            <p className="text-sm text-slate-500 font-medium">Give your unique referral code to businesses or friends.</p>

                        </div>
                        <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 text-left">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm mb-6">
                                <Users className="w-6 h-6" />
                            </div>
                            <h3 className="font-black text-slate-900 mb-2">2. Track Visits</h3>
                            <p className="text-sm text-slate-500 font-medium">When they register or check-in, we track it instantly.</p>
                        </div>
                        <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 text-left">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm mb-6">
                                <Wallet className="w-6 h-6" />
                            </div>
                            <h3 className="font-black text-slate-900 mb-2">3. Get Paid</h3>
                            <p className="text-sm text-slate-500 font-medium">Earn credit directly into your wallet for every conversion.</p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest">Affiliate Program</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: {stats?.referralCode}</span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900">Your Dashboard</h1>
                    </div>

                    <div className="p-1 bg-white rounded-2xl border border-slate-200 flex gap-2 w-full md:w-[400px]">
                        <div className="flex-1 px-4 py-3 text-base font-black text-slate-900 tracking-[0.2em] uppercase text-center">
                            {isMounted && stats?.referralCode ? stats.referralCode : 'Loading...'}
                        </div>
                        <button
                            onClick={copyCode}
                            className="px-6 py-3 bg-slate-900 text-white rounded-[14px] text-xs font-black uppercase tracking-widest hover:bg-orange-500 transition-all flex items-center gap-2"
                        >
                            {copySuccess ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copySuccess ? 'Copied' : 'Copy Code'}
                        </button>
                    </div>

                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    <div className="p-8 bg-white rounded-[28px] border border-slate-200 shadow-sm">
                        <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 mb-6">
                            <Timer className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan Extensions Earned</p>
                            <h3 className="text-3xl font-black text-slate-900">{stats?.convertedReferrals || 0} Months</h3>
                        </div>
                    </div>
                    <div className="p-8 bg-white rounded-[28px] border border-slate-200 shadow-sm">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 mb-6">
                            <Users className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Referrals</p>
                            <h3 className="text-3xl font-black text-slate-900">{stats?.totalReferrals || 0}</h3>
                        </div>
                    </div>
                    <div className="p-8 bg-white rounded-[28px] border border-slate-200 shadow-sm">
                        <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-500 mb-6">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conversions</p>
                            <h3 className="text-3xl font-black text-slate-900">{stats?.convertedReferrals || 0}</h3>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-[28px] border border-slate-200 overflow-hidden">
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between font-black text-slate-900">
                                <h3 className="text-xl">Referral History</h3>
                            </div>
                            <div className="p-4">
                                {referrals.length > 0 ? (
                                    <div className="space-y-2">
                                        {referrals.map((ref, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                                        <Users className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-slate-900">{ref.referredUser?.fullName || 'New Business'}</h4>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                            {new Date(ref.createdAt).toLocaleDateString()} • {ref.status}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${ref.status === 'converted' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                                                        {ref.status === 'converted' ? '+1 Month Extension' : 'Awaiting Activation'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-20 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                            <Timer className="w-8 h-8 text-slate-200" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No referrals yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="p-8 bg-slate-900 rounded-[28px] text-white">
                            <h3 className="text-xl font-black mb-4 italic">Earning Guide</h3>
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-orange-400 shrink-0">1</div>
                                    <p className="text-sm text-slate-300 font-medium">Get <span className="text-white font-black text-base">30 Days Free Plan</span> extension for every business that subscribes using your code.</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-blue-400 shrink-0">2</div>
                                    <p className="text-sm text-slate-300 font-medium">Extensions are applied <span className="text-white font-black italic text-base">automatically</span> upon Super Admin activation.</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-emerald-400 shrink-0">3</div>
                                    <p className="text-sm text-slate-300 font-medium">Unlimited referrals! Stack up your free months and keep your listing live for <span className="text-white font-black">Zero PKR</span>.</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-blue-600 rounded-[28px] text-white overflow-hidden relative group">
                            <Share2 className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 group-hover:scale-110 transition-transform duration-500" />
                            <h3 className="text-xl font-black mb-2">Need Help?</h3>
                            <p className="text-sm text-blue-100 font-medium mb-6 relative z-10">Contact our affiliate support for tips on how to grow your earnings.</p>
                            <button className="px-6 py-3 bg-white text-blue-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all relative z-10 shadow-lg">Contact Support</button>
                        </div>
                    </div>
                </div>                {/* Payout Modal */}
                <AnimatePresence>
                    {showPayoutModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowPayoutModal(false)}
                                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="relative w-full max-w-lg bg-white rounded-[28px] shadow-2xl overflow-hidden"
                            >
                                <div className="p-10">
                                    <h2 className="text-3xl font-black text-slate-900 mb-2">Withdraw Earnings</h2>
                                    <p className="text-slate-500 font-medium mb-8">Available balance: <b>PKR {stats?.balance}</b></p>

                                    <form onSubmit={handleRequestPayout} className="space-y-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Amount (Min PKR 500)</label>
                                            <input
                                                type="number"
                                                value={payoutAmount}
                                                onChange={(e) => setPayoutAmount(e.target.value)}
                                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold"
                                                placeholder="Enter amount"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Payment Method</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {['Bank Transfer', 'EasyPaisa', 'JazzCash', 'UPI'].map(method => (
                                                    <button
                                                        key={method}
                                                        type="button"
                                                        onClick={() => setPayoutMethod(method)}
                                                        className={`py-3 rounded-xl border-2 text-xs font-black transition-all ${payoutMethod === method ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                                    >
                                                        {method}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Payment Details (Account #, Name)</label>
                                            <textarea
                                                value={payoutDetails}
                                                onChange={(e) => setPayoutDetails(e.target.value)}
                                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold"
                                                placeholder="Enter your account details..."
                                                rows={3}
                                                required
                                            />
                                        </div>
                                        <div className="flex gap-4 pt-4">
                                            <button
                                                type="button"
                                                onClick={() => setShowPayoutModal(false)}
                                                className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={submittingPayout}
                                                className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-orange-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
                                            >
                                                {submittingPayout ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Request'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
        </div>
    );
}
