"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Megaphone, Plus, Trash2, Loader2, Save, X, 
    Clock, Calendar, Tag, DollarSign, ChevronLeft,
    TrendingUp, Info
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AdminOfferPricingPage() {
    const { user } = useAuth();
    const [prices, setPrices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [showModal, setShowModal] = useState(false);
    const [currentPricing, setCurrentPricing] = useState<any>({
        type: 'offer',
        name: '',
        price: '',
        unit: 'hours',
        duration: 1,
        isActive: true
    });

    const loadPrices = async () => {
        setLoading(true);
        try {
            const res = await api.admin.pricingPlans.getAll();
            setPrices(res);
        } catch (err: any) {
            setError(err.message || 'Failed to load pricing');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'admin' || user?.role === 'superadmin') {
            loadPrices();
        }
    }, [user]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (currentPricing.id) {
                await api.admin.pricingPlans.update(currentPricing.id, currentPricing);
            } else {
                await api.admin.pricingPlans.create(currentPricing);
            }
            setShowModal(false);
            loadPrices();
            setCurrentPricing({
                type: 'offer',
                name: '',
                price: '',
                unit: 'hours',
                duration: 1,
                isActive: true
            });
        } catch (err: any) {
            alert(err.message || 'Failed to save pricing');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this pricing?')) return;
        try {
            await api.admin.pricingPlans.delete(id);
            setPrices(prev => prev.filter(p => p.id !== id));
        } catch (err: any) {
            alert(err.message || 'Failed to delete pricing');
        }
    };

    if (user?.role !== 'admin' && user?.role !== 'superadmin') {
        return <div className="p-20 text-center">Unauthorized. Admins only.</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50/50">
            <div className="max-w-5xl mx-auto px-4 py-12">
                <Link href="/admin/offers" className="flex items-center gap-2 text-slate-400 hover:text-orange-500 font-bold mb-8 transition-colors group">
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Offers
                </Link>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <TrendingUp className="w-10 h-10 text-orange-500" />
                            Offer & Event Pricing
                        </h1>
                        <p className="text-slate-500 font-bold mt-2 text-lg">Set promotional rates for businesses to feature their content.</p>
                    </div>

                    <button 
                        onClick={() => {
                            setCurrentPricing({
                                type: 'offer',
                                name: '',
                                price: '',
                                unit: 'hours',
                                duration: 1,
                                isActive: true
                            });
                            setShowModal(true);
                        }}
                        className="flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-sm hover:bg-orange-500 transition-all hover:shadow-xl hover:shadow-orange-500/20 active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        Create New Price
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 animate-pulse h-64" />
                        ))
                    ) : prices.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                            <Info className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold text-lg">No pricing rules defined yet.</p>
                        </div>
                    ) : (
                        prices.map(price => (
                            <motion.div 
                                layout
                                key={price.id}
                                className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${price.type === 'event' ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-500'}`}>
                                        {price.type === 'event' ? <Calendar className="w-7 h-7" /> : <Tag className="w-7 h-7" />}
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => {
                                                setCurrentPricing(price);
                                                setShowModal(true);
                                            }}
                                            className="p-3 bg-slate-50 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                                        >
                                            <Save className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(price.id)}
                                            className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                
                                <h3 className="text-2xl font-black text-slate-900 mb-2 truncate">{price.name}</h3>
                                <div className="flex items-center gap-2 mb-6">
                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${price.type === 'event' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                        {price.type}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-slate-200" />
                                    <span className="text-slate-400 font-bold text-xs flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {price.duration} {price.unit}
                                    </span>
                                </div>

                                <div className="flex items-end justify-between pt-6 border-t border-slate-50">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Price</p>
                                        <p className="text-3xl font-black text-slate-900">${price.price}</p>
                                    </div>
                                    {!price.isActive && (
                                        <span className="px-3 py-1 bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-lg">Inactive</span>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Create/Edit Modal */}
                <AnimatePresence>
                    {showModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                            <motion.form 
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                onSubmit={handleSave}
                                className="bg-white rounded-[3rem] p-12 max-w-xl w-full shadow-2xl relative overflow-hidden"
                            >
                                <button type="button" onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 transition-colors">
                                    <X className="w-6 h-6" />
                                </button>

                                <h2 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-3">
                                    <Plus className="w-8 h-8 text-orange-500" />
                                    {currentPricing.id ? 'Edit Pricing' : 'New Pricing Rule'}
                                </h2>

                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Pricing Name</label>
                                        <input 
                                            required
                                            value={currentPricing.name}
                                            onChange={e => setCurrentPricing({...currentPricing, name: e.target.value})}
                                            placeholder="e.g. 1 Hour Flash Promotion"
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-orange-500/10 transition-all"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Apply To</label>
                                            <select 
                                                value={currentPricing.type}
                                                onChange={e => setCurrentPricing({...currentPricing, type: e.target.value})}
                                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-orange-500/10 transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="offer">Business Offer</option>
                                                <option value="event">Business Event</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Price (USD)</label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <input 
                                                    required
                                                    type="number"
                                                    value={currentPricing.price}
                                                    onChange={e => setCurrentPricing({...currentPricing, price: e.target.value})}
                                                    placeholder="0.00"
                                                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-orange-500/10 transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Duration</label>
                                            <input 
                                                required
                                                type="number"
                                                value={currentPricing.duration}
                                                onChange={e => setCurrentPricing({...currentPricing, duration: parseInt(e.target.value)})}
                                                min="1"
                                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-orange-500/10 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Unit</label>
                                            <select 
                                                value={currentPricing.unit}
                                                onChange={e => setCurrentPricing({...currentPricing, unit: e.target.value})}
                                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-orange-500/10 transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="minutes">Minutes</option>
                                                <option value="hours">Hours</option>
                                                <option value="days">Days</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="pt-6">
                                        <button 
                                            disabled={saving}
                                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-orange-500 transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-3"
                                        >
                                            {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                                            {currentPricing.id ? 'Update Pricing Rule' : 'Create Pricing Rule'}
                                        </button>
                                    </div>
                                </div>
                            </motion.form>
                        </div>
                    )}
                </AnimatePresence>
            </div>
            <Footer />
        </div>
    );
}
