"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    MapPin,
    RefreshCw,
    Loader2,
    Save,
    AlertCircle,
    Search,
    ChevronLeft,
    ExternalLink,
} from 'lucide-react';
import { api, getImageUrl } from '../../../lib/api';
import { ListingImage } from '../../../components/ListingImage';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from "react-hot-toast";

export default function AdminGeoPage() {
    const [businesses, setBusinesses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [latInput, setLatInput] = useState('');
    const [lngInput, setLngInput] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.admin.getPendingGeocodeBusinesses();
            setBusinesses(data || []);
        } catch (err) {
            console.error('Failed to fetch geocode queue:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSave = async (id: string) => {
        const lat = parseFloat(latInput);
        const lng = parseFloat(lngInput);
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            toast.error('Invalid coordinates. Latitude must be -90 to 90, longitude -180 to 180.');
            return;
        }
        setSaving(id);
        try {
            await api.admin.updateBusinessCoordinates(id, lat, lng);
            setBusinesses(prev => prev.filter(b => b.id !== id));
            setSelectedId(null);
            setLatInput('');
            setLngInput('');
        } catch (err: any) {
            toast.error(err.message || 'Failed to update coordinates');
        } finally {
            setSaving(null);
        }
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full mb-3">
                        <MapPin className="w-3 h-3 text-amber-500" />
                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Geo Correction</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Geo-Data Correction Panel</h1>
                    <p className="text-slate-400 font-medium mt-1">
                        {businesses.length} businesses awaiting map coordinate correction.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/listings"
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <ChevronLeft className="w-4 h-4" /> Listings
                    </Link>
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="flex items-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 rounded-2xl font-bold text-slate-600 transition-all active:scale-95"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <Loader2 className="w-10 h-10 animate-spin text-slate-300" />
                </div>
            ) : businesses.length === 0 ? (
                <div className="bg-white rounded-[28px] p-24 flex flex-col items-center text-center border-2 border-dashed border-slate-100">
                    <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
                        <MapPin className="w-12 h-12 text-emerald-500" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900">All Clear!</h3>
                    <p className="text-slate-400 font-medium mt-2 max-w-xs">No businesses currently need geo-coordinate corrections.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    <AnimatePresence mode="popLayout">
                        {businesses.map((b) => (
                            <motion.div
                                key={b.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden"
                            >
                                <div className="p-6 flex flex-col lg:flex-row gap-6">
                                    <div className="flex items-center gap-4 shrink-0">
                                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0">
                                            <ListingImage
                                                src={b.coverImageUrl || b.images?.[0]}
                                                alt={b.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-lg font-black text-slate-900 truncate">{b.title}</h3>
                                            <p className="text-xs text-slate-400 font-bold flex items-center gap-1 mt-1">
                                                <MapPin className="w-3 h-3" /> {b.city}, {b.state}
                                            </p>
                                            <p className="text-xs text-slate-400 font-medium mt-0.5">
                                                {b.address || 'No address'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex-1 flex items-center gap-4">
                                        <div className="grid grid-cols-2 gap-3 flex-1">
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Latitude</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    placeholder="e.g. 33.6844"
                                                    value={selectedId === b.id ? latInput : (b.latitude || '')}
                                                    onChange={(e) => {
                                                        setSelectedId(b.id);
                                                        setLatInput(e.target.value);
                                                    }}
                                                    className="w-full px-3 py-2.5 text-sm font-bold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Longitude</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    placeholder="e.g. 73.0479"
                                                    value={selectedId === b.id ? lngInput : (b.longitude || '')}
                                                    onChange={(e) => {
                                                        setSelectedId(b.id);
                                                        setLngInput(e.target.value);
                                                    }}
                                                    className="w-full px-3 py-2.5 text-sm font-bold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2 shrink-0">
                                            <button
                                                onClick={() => handleSave(b.id)}
                                                disabled={saving === b.id}
                                                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm disabled:opacity-50"
                                            >
                                                {saving === b.id ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <Save className="w-3.5 h-3.5" />
                                                )}
                                                Save
                                            </button>
                                            <button
                                                onClick={() => window.open(`/business/${b.slug}`, '_blank')}
                                                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" /> View
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
