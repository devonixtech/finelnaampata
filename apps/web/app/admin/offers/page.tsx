"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Megaphone, CheckCircle2, XCircle, Search, 
    Filter, Loader2, Star, Calendar, Tag, ShieldCheck,
    ChevronLeft, ChevronRight, LayoutGrid, List, Trash2, ExternalLink, DollarSign
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AdminOffersPage() {
    const { user } = useAuth();
    const [offers, setOffers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const loadOffers = async (p = 1) => {
        setLoading(true);
        try {
            const res = await api.offers.adminGetAll(p, 20);
            setOffers(res.data);
            setMeta(res.meta);
        } catch (err: any) {
            setError(err.message || 'Failed to load offers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'admin') {
            loadOffers(1);
        }
    }, [user]);

    const handleToggleFeatured = async (id: string, currentStatus: boolean) => {
        setTogglingId(id);
        try {
            await api.offers.adminToggleFeatured(id, !currentStatus);
            setOffers(prev => prev.map(o => o.id === id ? { ...o, isFeatured: !currentStatus } : o));
        } catch (err: any) {
            alert(err.message || 'Failed to toggle featured status');
        } finally {
            setTogglingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this offer?')) return;
        try {
            await api.offers.remove(id);
            setOffers(prev => prev.filter(o => o.id !== id));
        } catch (err: any) {
            alert(err.message || 'Failed to delete offer');
        }
    };

    if (user?.role !== 'admin') {
        return <div className="p-20 text-center">Unauthorized. Admins only.</div>;
    }

    const filteredOffers = offers.filter(o => 
        o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.business?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.vendor?.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Megaphone className="w-10 h-10 text-orange-500" />
                            Deals & Events
                        </h1>
                        <p className="text-slate-500 font-bold mt-2 flex items-center gap-4">
                            Manage all business offers and feature them on home/category pages.
                            <Link href="/admin/offers/pricing" className="text-orange-500 hover:underline flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                Manage Pricing
                            </Link>
                        </p>
                    </div>

                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Filter by title, business owner, or business..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                        />
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Offer/Event</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Business</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Dates</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Featured</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center">
                                            <Loader2 className="w-8 h-8 animate-spin text-slate-300 mx-auto" />
                                        </td>
                                    </tr>
                                ) : filteredOffers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center text-slate-400 font-bold">No offers found.</td>
                                    </tr>
                                ) : (
                                    filteredOffers.map(offer => (
                                        <tr key={offer.id} className="hover:bg-slate-50/30 transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    {offer.imageUrl ? (
                                                        <img src={offer.imageUrl} className="w-12 h-12 rounded-xl object-cover" />
                                                    ) : (
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${offer.type === 'event' ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-500'}`}>
                                                            {offer.type === 'event' ? <Calendar className="w-6 h-6" /> : <Tag className="w-6 h-6" />}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-black text-slate-900 text-sm leading-tight">{offer.title}</p>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{offer.business?.title}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="text-sm font-bold text-slate-700">{offer.vendor?.user?.fullName || 'N/A'}</p>
                                                <p className="text-xs text-slate-400">{offer.vendor?.user?.email}</p>
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="text-xs font-bold text-slate-600">Start: {new Date(offer.startDate).toLocaleDateString()}</p>
                                                <p className="text-xs text-slate-400">Expiry: {new Date(offer.expiryDate).toLocaleDateString()}</p>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                                    offer.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 
                                                    offer.status === 'scheduled' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'
                                                }`}>
                                                    {offer.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <button 
                                                    onClick={() => handleToggleFeatured(offer.id, offer.isFeatured)}
                                                    disabled={togglingId === offer.id}
                                                    className={`group relative flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                        offer.isFeatured ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                                    }`}
                                                >
                                                    {togglingId === offer.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Star className={`w-3 h-3 ${offer.isFeatured ? 'fill-white' : ''}`} />}
                                                    {offer.isFeatured ? 'Featured' : 'Regular'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/offers-events/${offer.id}`} target="_blank" className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-all">
                                                        <ExternalLink className="w-4 h-4" />
                                                    </Link>
                                                    <button onClick={() => handleDelete(offer.id)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-all">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {meta && meta.totalPages > 1 && (
                    <div className="mt-8 flex justify-center gap-2">
                        <button 
                            disabled={page === 1}
                            onClick={() => { const p = page - 1; setPage(p); loadOffers(p); }}
                            className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-100 disabled:opacity-30 hover:bg-slate-50 transition-all font-black text-slate-600"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        {[...Array(meta.totalPages)].map((_, i) => (
                            <button 
                                key={i}
                                onClick={() => { setPage(i + 1); loadOffers(i + 1); }}
                                className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${page === i + 1 ? 'bg-slate-900 text-white shadow-lg' : 'hover:bg-slate-50 text-slate-500'}`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button 
                            disabled={page === meta.totalPages}
                            onClick={() => { const p = page + 1; setPage(p); loadOffers(p); }}
                            className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-100 disabled:opacity-30 hover:bg-slate-50 transition-all font-black text-slate-600"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
}
