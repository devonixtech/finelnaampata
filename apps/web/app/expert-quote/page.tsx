'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Link from 'next/link';
import { ChevronRight, Send, CheckCircle2, Loader2, Sparkles, Star, Shield, Users } from 'lucide-react';

export default function ExpertQuotePage() {
    const { user } = useAuth();
    const [form, setForm] = useState({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        categorySlug: '',
        categoryName: '',
        description: '',
        preferredContact: 'email',
        city: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        setError('');
        try {
            await api.expertQuote.create({
                ...form,
                userId: user?.id,
            });
            setSubmitted(true);
            setForm({
                customerName: '',
                customerEmail: '',
                customerPhone: '',
                categorySlug: '',
                categoryName: '',
                description: '',
                preferredContact: 'email',
                city: '',
            });
        } catch (err: any) {
            setError(err?.message || 'Failed to submit. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-10 pb-20 lg:pt-10 lg:pb-28">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/30 mb-10">
                        <Link href="/" className="hover:text-orange-400">Home</Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-white/70">Expert Quote</span>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
                        <div className="max-w-3xl">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="px-4 py-1.5 bg-orange-500/20 text-orange-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-500/30 flex items-center gap-2">
                                    <Sparkles className="w-3 h-3" /> Get Expert Advice
                                </div>
                            </div>
                            <h1 className="text-5xl lg:text-7xl font-black text-white mb-8 tracking-tighter leading-[0.9]">
                                Get an Expert <br />
                                <span className="text-orange-400">Quote.</span>
                            </h1>
                            <p className="text-xl text-white/50 font-bold leading-relaxed max-w-xl">
                                Submit your requirements and receive quotes from top professionals in your industry.
                            </p>
                        </div>

                        <div className="flex items-center gap-8 bg-white/5 p-8 rounded-[20px] border border-white/10">
                            <div className="flex items-center gap-3 text-white/70">
                                <Shield className="w-8 h-8 text-orange-400" />
                                <div>
                                    <div className="text-sm font-bold">Free Service</div>
                                    <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider">No obligations</div>
                                </div>
                            </div>
                            <div className="w-px h-12 bg-white/10" />
                            <div className="flex items-center gap-3 text-white/70">
                                <Users className="w-8 h-8 text-orange-400" />
                                <div>
                                    <div className="text-sm font-bold">Verified Pros</div>
                                    <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Curated experts</div>
                                </div>
                            </div>
                            <div className="w-px h-12 bg-white/10" />
                            <div className="flex items-center gap-3 text-white/70">
                                <Star className="w-8 h-8 text-orange-400" />
                                <div>
                                    <div className="text-sm font-bold">Fast Response</div>
                                    <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Within 24 hours</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20 pb-20">
                {submitted ? (
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-premium p-12 text-center">
                        <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Quote Submitted!</h2>
                        <p className="text-slate-400 font-bold text-lg mb-8 max-w-md mx-auto">
                            Thank you! Experts in your category will review your requirements and get back to you.
                        </p>
                        <div className="flex items-center justify-center gap-4">
                            <button
                                onClick={() => setSubmitted(false)}
                                className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all"
                            >
                                Submit Another
                            </button>
                            <Link
                                href="/"
                                className="px-8 py-4 bg-slate-50 text-slate-700 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-all"
                            >
                                Back to Home
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-premium p-8 lg:p-12">
                        <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Submit Your Requirement</h2>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl">
                                <p className="text-sm font-bold text-red-600">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Your Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.customerName}
                                        onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))}
                                        placeholder="John Doe"
                                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email *</label>
                                    <input
                                        type="email"
                                        required
                                        value={form.customerEmail}
                                        onChange={e => setForm(p => ({ ...p, customerEmail: e.target.value }))}
                                        placeholder="john@example.com"
                                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Phone</label>
                                    <input
                                        type="tel"
                                        value={form.customerPhone}
                                        onChange={e => setForm(p => ({ ...p, customerPhone: e.target.value }))}
                                        placeholder="+92 300 1234567"
                                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">City</label>
                                    <input
                                        type="text"
                                        value={form.city}
                                        onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                                        placeholder="Lahore"
                                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Category *</label>
                                <input
                                    type="text"
                                    required
                                    value={form.categoryName}
                                    onChange={e => setForm(p => ({ ...p, categoryName: e.target.value, categorySlug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                                    placeholder="e.g. Digital Marketing, Web Development, Interior Design"
                                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Preferred Contact Method</label>
                                <div className="flex gap-3">
                                    {['email', 'phone', 'whatsapp'].map(method => (
                                        <button
                                            key={method}
                                            type="button"
                                            onClick={() => setForm(p => ({ ...p, preferredContact: method }))}
                                            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all ${form.preferredContact === method ? 'border-orange-400 bg-orange-50 text-orange-600' : 'border-slate-100 bg-slate-50 text-slate-400 hover:bg-white'}`}
                                        >
                                            {method}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Describe Your Requirements * (Min 20 characters)</label>
                                <textarea
                                    required
                                    rows={5}
                                    value={form.description}
                                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                    placeholder="Tell us about your project, budget, timeline, and any specific requirements..."
                                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
                                />
                                <p className="text-[10px] font-bold text-slate-400 text-right mt-1">{form.description.length} / 2000</p>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || form.description.length < 20}
                                className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-orange-500/20 active:scale-95"
                            >
                                {submitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                                {submitting ? 'Submitting...' : 'Submit Expert Quote'}
                            </button>

                            {user && (
                                <p className="text-[10px] text-slate-400 font-bold text-center">
                                    Daily limit: 3 quotes for users, 10 quotes for businesses
                                </p>
                            )}
                        </form>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
