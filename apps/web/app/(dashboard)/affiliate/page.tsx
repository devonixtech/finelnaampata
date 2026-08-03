"use client";

import React, { useState, useEffect } from 'react';
import {
    Users, TrendingUp, Wallet, Link as LinkIcon,
    CheckCircle2, Copy, Share2, ArrowRight,
    Gift, Timer, AlertCircle, ChevronRight, Loader2,
    Eye, MousePointerClick, DollarSign, Clock, Shield,
    Upload, FileCheck, X, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';

export default function AffiliateDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [earnings, setEarnings] = useState<any>(null);
    const [referrals, setReferrals] = useState<any[]>([]);
    const [payouts, setPayouts] = useState<any[]>([]);
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'conversions' | 'payouts'>('overview');

    // Custom Alert State
    const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: 'success' | 'error' } | null>(null);

    const showAlert = (title: string, message: string, type: 'success' | 'error' = 'error') => {
        setAlertConfig({ title, message, type });
    };

    // Payout Form State
    const [showPayoutModal, setShowPayoutModal] = useState(false);
    const [payoutAmount, setPayoutAmount] = useState('');
    const [payoutMethod, setPayoutMethod] = useState('Bank Transfer');
    const [payoutDetails, setPayoutDetails] = useState('');
    const [submittingPayout, setSubmittingPayout] = useState(false);
    const [payoutAgreed, setPayoutAgreed] = useState(false);

    // KYC State
    const [showKycModal, setShowKycModal] = useState(false);
    const [kycDocumentUrl, setKycDocumentUrl] = useState('');
    const [submittingKyc, setSubmittingKyc] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        if (user) {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        try {
            const [statsData, earningsData, refData, payoutData, settingsData] = await Promise.all([
                api.affiliate.getStats(),
                api.affiliate.getEarningsBreakdown().catch(() => null),
                api.affiliate.getReferrals(),
                api.affiliate.getPayouts(),
                api.affiliate.getSettings()
            ]);
            setStats(statsData);
            setEarnings(earningsData);
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
            showAlert('Success', 'Successfully joined the affiliate program!', 'success');
        } catch (err: any) {
            showAlert('Error', err.message || 'Failed to join affiliate program', 'error');
        } finally {
            setJoining(false);
        }
    };

    const handleRequestPayout = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(payoutAmount);

        if (isNaN(amount) || amount < 500) {
            showAlert('Invalid Amount', 'Minimum withdrawal is Rs. 500', 'error');
            return;
        }

        if (amount > (earnings?.balance || stats?.balance || 0)) {
            showAlert('Insufficient Balance', 'You do not have enough balance for this withdrawal', 'error');
            return;
        }

        if (!payoutDetails) {
            showAlert('Missing Details', 'Please provide payment details', 'error');
            return;
        }

        if (!payoutAgreed) {
            showAlert('Agreement Required', 'Please confirm the payment details are accurate before submitting.', 'error');
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
            showAlert('Request Submitted', 'Payout request submitted successfully!', 'success');
        } catch (err: any) {
            showAlert('Request Failed', err.message || 'Failed to submit payout request', 'error');
        } finally {
            setSubmittingPayout(false);
        }
    };

    const handleSubmitKyc = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!kycDocumentUrl) {
            showAlert('Missing Document', 'Please provide a document URL', 'error');
            return;
        }
        setSubmittingKyc(true);
        try {
            await api.affiliate.submitKyc(kycDocumentUrl);
            setShowKycModal(false);
            setKycDocumentUrl('');
            await loadData();
            showAlert('KYC Submitted', 'Your KYC document has been submitted for review!', 'success');
        } catch (err: any) {
            showAlert('KYC Failed', err.message || 'Failed to submit KYC', 'error');
        } finally {
            setSubmittingKyc(false);
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
                {!stats?.hasRegisteredBusiness && !user?.vendor?.id && stats?.hasReferrer && (
                    <div className="mb-12 p-6 bg-slate-50 border border-slate-100 rounded-3xl max-w-md mx-auto text-left shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Referred By Affiliate</p>
                        <p className="text-base font-black text-slate-900">{stats.referrerName || 'Affiliate Partner'}</p>
                    </div>
                )}
                <div className="w-24 h-24 bg-orange-50 rounded-[28px] flex items-center justify-center mx-auto mb-8">
                    <Gift className="w-12 h-12 text-orange-500" />
                </div>
                <h1 className="text-4xl font-black text-slate-900 mb-4">Join Our Affiliate Program</h1>
                <p className="text-slate-500 text-lg mb-10 max-w-2xl mx-auto font-medium">
                    Earn rewards for every business you refer. Start earning today with Punjab's leading business network.
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
                        <p className="text-sm text-slate-500 font-medium">When they register or subscribe, we track it instantly.</p>
                    </div>
                    <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 text-left">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm mb-6">
                            <Wallet className="w-6 h-6" />
                        </div>
                        <h3 className="font-black text-slate-900 mb-2">3. Get Paid</h3>
                        <p className="text-sm text-slate-500 font-medium">Earn commission after 30-day hold period.</p>
                    </div>
                </div>
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

                <div className="flex gap-3">
                    <button
                        onClick={() => setShowKycModal(true)}
                        className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
                            stats?.kycStatus === 'approved' 
                                ? 'bg-emerald-100 text-emerald-600' 
                                : stats?.kycStatus === 'pending' 
                                    ? 'bg-amber-100 text-amber-600' 
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        {stats?.kycStatus === 'approved' ? <FileCheck className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                        {stats?.kycStatus === 'approved' ? 'KYC Verified' : stats?.kycStatus === 'pending' ? 'KYC Pending' : 'Submit KYC'}
                    </button>
                    <button
                        onClick={() => setShowPayoutModal(true)}
                        className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-orange-500 transition-all flex items-center gap-2"
                    >
                        <Wallet className="w-4 h-4" /> Withdraw
                    </button>
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

            {/* Earnings Overview Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="p-6 bg-white rounded-[24px] border border-slate-200 shadow-sm">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 mb-4">
                        <DollarSign className="w-5 h-5" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Earned</p>
                    <p className="text-2xl font-black text-slate-900">Rs. {earnings?.totalEarned || stats?.totalEarnings || 0}</p>
                </div>
                <div className="p-6 bg-white rounded-[24px] border border-slate-200 shadow-sm">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 mb-4">
                        <Wallet className="w-5 h-5" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Balance</p>
                    <p className="text-2xl font-black text-slate-900">Rs. {earnings?.balance || stats?.balance || 0}</p>
                </div>
                <div className="p-6 bg-white rounded-[24px] border border-slate-200 shadow-sm">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 mb-4">
                        <Clock className="w-5 h-5" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending (30-day hold)</p>
                    <p className="text-2xl font-black text-slate-900">Rs. {earnings?.balanceHeld || 0}</p>
                </div>
                <div className="p-6 bg-white rounded-[24px] border border-slate-200 shadow-sm">
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-500 mb-4">
                        <DollarSign className="w-5 h-5" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Paid Out</p>
                    <p className="text-2xl font-black text-slate-900">Rs. {earnings?.paidOut || stats?.totalWithdrawals || 0}</p>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="p-5 bg-white rounded-[20px] border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500">
                        <MousePointerClick className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clicks</p>
                        <p className="text-xl font-black text-slate-900">{earnings?.clicks || stats?.totalReferrals || 0}</p>
                    </div>
                </div>
                <div className="p-5 bg-white rounded-[20px] border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Signups</p>
                        <p className="text-xl font-black text-slate-900">{earnings?.signups || stats?.totalReferrals || 0}</p>
                    </div>
                </div>
                <div className="p-5 bg-white rounded-[20px] border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conversions</p>
                        <p className="text-xl font-black text-slate-900">{earnings?.conversions || stats?.convertedReferrals || 0}</p>
                    </div>
                </div>
                <div className="p-5 bg-white rounded-[20px] border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center text-violet-500">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conversion Rate</p>
                        <p className="text-xl font-black text-slate-900">{(earnings?.conversionRate || 0).toFixed(1)}%</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-8 p-1 bg-slate-100 rounded-2xl w-fit">
                {(['overview', 'conversions', 'payouts'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        {tab === 'overview' ? 'Referral History' : tab === 'conversions' ? 'Conversions' : 'Payout History'}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div className="bg-white rounded-[28px] border border-slate-200 overflow-hidden">
                    <div className="p-8 border-b border-slate-100">
                        <h3 className="text-xl font-black text-slate-900">Referral History</h3>
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
                                            <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                ref.status === 'converted' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'
                                            }`}>
                                                {ref.status === 'converted' ? 'Converted' : 'Pending'}
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
            )}

            {activeTab === 'conversions' && (
                <div className="bg-white rounded-[28px] border border-slate-200 overflow-hidden">
                    <div className="p-8 border-b border-slate-100">
                        <h3 className="text-xl font-black text-slate-900">Paid Conversions</h3>
                        <p className="text-sm text-slate-500 mt-1">Referrals that resulted in paid subscriptions</p>
                    </div>
                    <div className="p-4">
                        {referrals.filter(r => r.status === 'converted').length > 0 ? (
                            <div className="space-y-2">
                                {referrals.filter(r => r.status === 'converted').map((ref, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
                                                <CheckCircle2 className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-slate-900">{ref.referredUser?.fullName || 'Business'}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                    Converted on {new Date(ref.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-emerald-600">+10 Days</p>
                                            <p className="text-[10px] font-bold text-slate-400">Plan Extension</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-20 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                    <CheckCircle2 className="w-8 h-8 text-slate-200" />
                                </div>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No conversions yet</p>
                                <p className="text-xs text-slate-400 mt-2">Conversions appear after 30-day hold period</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'payouts' && (
                <div className="bg-white rounded-[28px] border border-slate-200 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black text-slate-900">Payout History</h3>
                            <p className="text-sm text-slate-500 mt-1">Your withdrawal requests and their status</p>
                        </div>
                        <button
                            onClick={() => setShowPayoutModal(true)}
                            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-500 transition-all"
                        >
                            Request Payout
                        </button>
                    </div>
                    <div className="p-4">
                        {payouts.length > 0 ? (
                            <div className="space-y-2">
                                {payouts.map((payout, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                                payout.status === 'paid' ? 'bg-emerald-50 text-emerald-500' :
                                                payout.status === 'approved' ? 'bg-blue-50 text-blue-500' :
                                                payout.status === 'rejected' ? 'bg-red-50 text-red-500' :
                                                'bg-amber-50 text-amber-500'
                                            }`}>
                                                <Wallet className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-slate-900">Rs. {payout.amount}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                    {payout.paymentMethod} • {new Date(payout.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                payout.status === 'paid' ? 'bg-emerald-100 text-emerald-600' :
                                                payout.status === 'approved' ? 'bg-blue-100 text-blue-600' :
                                                payout.status === 'rejected' ? 'bg-red-100 text-red-600' :
                                                'bg-amber-100 text-amber-600'
                                            }`}>
                                                {payout.status}
                                            </span>
                                            {payout.paymentReference && (
                                                <p className="text-[10px] text-slate-400 mt-1">Ref: {payout.paymentReference}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-20 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                    <Wallet className="w-8 h-8 text-slate-200" />
                                </div>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No payouts yet</p>
                                <p className="text-xs text-slate-400 mt-2">Minimum withdrawal: Rs. 500</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Earning Guide Sidebar */}
            <div className="mt-8 p-8 bg-slate-900 rounded-[28px] text-white">
                <h3 className="text-xl font-black mb-6">How Earnings Work</h3>
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="flex gap-4">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-orange-400 shrink-0">1</div>
                        <p className="text-sm text-slate-300 font-medium">Share your code. When a business subscribes using your code, you earn commission.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-blue-400 shrink-0">2</div>
                        <p className="text-sm text-slate-300 font-medium">Commission is held for <span className="text-white font-black">30 days</span> before becoming available for withdrawal.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-emerald-400 shrink-0">3</div>
                        <p className="text-sm text-slate-300 font-medium">Both you and the referred business get <span className="text-white font-black">+10 days</span> free plan extension!</p>
                    </div>
                </div>
            </div>

            {/* Custom Alert Modal */}
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

            {/* Payout Modal */}
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
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-3xl font-black text-slate-900">Withdraw Earnings</h2>
                                    <button onClick={() => setShowPayoutModal(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                                        <X className="w-5 h-5 text-slate-400" />
                                    </button>
                                </div>
                                <p className="text-slate-500 font-medium mb-8">Available balance: <b className="text-slate-900">Rs. {earnings?.balance || stats?.balance || 0}</b></p>

                                <form onSubmit={handleRequestPayout} className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Amount (Min Rs. 500)</label>
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
                                    <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-xl bg-slate-50 border border-slate-100">
                                        <div className="relative flex items-center justify-center mt-0.5">
                                            <input
                                                type="checkbox"
                                                checked={payoutAgreed}
                                                onChange={(e) => setPayoutAgreed(e.target.checked)}
                                                className="w-5 h-5 appearance-none border-2 border-slate-300 rounded-lg checked:border-orange-500 checked:bg-orange-500 transition-colors cursor-pointer peer"
                                            />
                                            <svg className="w-3 h-3 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        </div>
                                        <span className="text-[11px] text-slate-600 font-medium leading-relaxed">
                                            I confirm that the payment details above are accurate and authorize the platform to process this withdrawal. *
                                        </span>
                                    </label>
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
                                            disabled={submittingPayout || !payoutAgreed}
                                            className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-orange-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
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

            {/* KYC Modal */}
            <AnimatePresence>
                {showKycModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowKycModal(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-white rounded-[28px] shadow-2xl overflow-hidden"
                        >
                            <div className="p-10">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-3xl font-black text-slate-900">Submit KYC</h2>
                                    <button onClick={() => setShowKycModal(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                                        <X className="w-5 h-5 text-slate-400" />
                                    </button>
                                </div>
                                <p className="text-slate-500 font-medium mb-8">
                                    Upload a valid ID document (CNIC, Passport, or Driver's License) for verification.
                                </p>

                                <form onSubmit={handleSubmitKyc} className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Document URL</label>
                                        <input
                                            type="url"
                                            value={kycDocumentUrl}
                                            onChange={(e) => setKycDocumentUrl(e.target.value)}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold"
                                            placeholder="https://example.com/document.jpg"
                                            required
                                        />
                                        <p className="text-xs text-slate-400 mt-2">Upload your document to a file sharing service and paste the URL here</p>
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowKycModal(false)}
                                            className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submittingKyc}
                                            className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-orange-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                        >
                                            {submittingKyc ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit KYC'}
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
