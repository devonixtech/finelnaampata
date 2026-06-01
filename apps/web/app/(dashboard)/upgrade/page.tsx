"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Building2, Phone, ArrowRight, Loader2, Zap, CheckCircle2, MapPin } from 'lucide-react';
import { api } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';

export default function BusinessUpgradePage() {
    const { user, syncProfile } = useAuth();
    const router = useRouter();
    const [businessName, setBusinessName] = useState('');
    const [businessPhone, setBusinessPhone] = useState(user?.phone || '');
    const [businessAddress, setBusinessAddress] = useState('');
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.businessProfiles.register({
                businessName,
                businessPhone,
                businessAddress,
            });

            // The backend successfully upgraded the user role.
            // Synchronize the profile so the frontend knows the new role.
            await syncProfile();

            // Redirect to subscription plans since they are now a business account without a plan
            router.push('/subscription?upgrade=success');
        } catch (err: any) {
            setError(err.message || 'Failed to upgrade account. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-10 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[24px] shadow-2xl shadow-blue-900/5 p-8 sm:p-12 border border-slate-100 relative overflow-hidden"
            >
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

                <div className="mb-10 relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-50 rounded-2xl flex items-center justify-center mb-6">
                        <Zap className="w-8 h-8 text-orange-500" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Upgrade to Paid Business Plan</h1>
                    <p className="text-slate-500 font-bold leading-relaxed">
                        Transform your regular user account into a powerful business profile. Start listing your services, tracking leads, and connecting with thousands of local customers.
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mb-10">
                    <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-black text-sm text-slate-900">List Your Services</h4>
                            <p className="text-xs font-bold text-slate-500 mt-1">Get discovered by top customers.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-black text-sm text-slate-900">Track Performance</h4>
                            <p className="text-xs font-bold text-slate-500 mt-1">Advanced analytics and insights.</p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-8 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-600 flex-shrink-0" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6 relative">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Name <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                required
                                minLength={2}
                                type="text"
                                className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-orange-500/20 focus:bg-white focus:ring-4 focus:ring-orange-500/5 rounded-2xl text-slate-900 font-bold transition-all outline-none"
                                placeholder="e.g. Acme Plumbing Details"
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Phone <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                required
                                type="tel"
                                className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-orange-500/20 focus:bg-white focus:ring-4 focus:ring-orange-500/5 rounded-2xl text-slate-900 font-bold transition-all outline-none"
                                placeholder="+1 234 567 890"
                                value={businessPhone}
                                onChange={(e) => setBusinessPhone(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Address <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                required
                                minLength={5}
                                type="text"
                                className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-orange-500/20 focus:bg-white focus:ring-4 focus:ring-orange-500/5 rounded-2xl text-slate-900 font-bold transition-all outline-none"
                                placeholder="e.g. 123 Main St, Sector F-6, Islamabad"
                                value={businessAddress}
                                onChange={(e) => setBusinessAddress(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <label className="flex items-start gap-3 cursor-pointer group mb-6">
                            <div className="relative flex items-center justify-center mt-0.5">
                                <input
                                    type="checkbox"
                                    checked={agreed}
                                    onChange={(e) => setAgreed(e.target.checked)}
                                    className="w-5 h-5 appearance-none border-2 border-slate-300 rounded-lg checked:border-orange-500 checked:bg-orange-500 transition-colors cursor-pointer peer"
                                />
                                <svg className="w-3.5 h-3.5 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </div>
                            <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                                I agree to the <a href="/terms" target="_blank" className="text-orange-500 font-bold hover:underline">Terms & Conditions</a> and <a href="/privacy" target="_blank" className="text-orange-500 font-bold hover:underline">Privacy Policy</a>, and acknowledge that upgrading to a business account constitutes a legal obligation.
                            </span>
                        </label>

                        <button
                            disabled={loading || !agreed}
                            type="submit"
                            className="w-full py-5 bg-[#FF7A30] hover:bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all shadow-xl shadow-orange-500/20 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    Complete Upgrade
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
