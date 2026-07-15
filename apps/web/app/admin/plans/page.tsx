"use client";

import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { Loader2, Plus, Edit, Trash2, CheckCircle2, XCircle, AlertCircle, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';

// Defined features from usePlanFeature.ts
const booleanFeatures = [
    'showListings', 'showSaved', 'showFollowing', 'showQueries', 
    'showLeads', 'showOffers', 'showReviews', 'showAnalytics', 
    'showChat', 'showBroadcast', 'canRespondBroadcast', 'canReplyReviews', 
    'showDemand', 'showCustomerNotes', 'canAddListing', 'canCreateAlbums', 'isFeatured'
];

const numberFeatures = [
    'maxListings', 'maxKeywords', 'maxOffers', 'maxEvents', 
    'maxFaqs', 'maxSubCategories'
];

export default function PlansPage() {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
    const [editingPlan, setEditingPlan] = useState<any>(null);
    const [formData, setFormData] = useState<any>({
        name: '',
        description: '',
        planType: 'basic',
        price: 0,
        billingCycle: 'monthly',
        isActive: true,
        isFeatured: false,
        dashboardFeatures: {}
    });

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const response = await api.admin.plans.getAll();
            setPlans(Array.isArray(response) ? response : []);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch plans');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleOpenModal = (mode: 'create' | 'edit', plan?: any) => {
        setModalMode(mode);
        if (mode === 'edit' && plan) {
            setEditingPlan(plan);
            setFormData({
                name: plan.name || '',
                description: plan.description || '',
                planType: plan.planType || 'basic',
                price: plan.price || 0,
                billingCycle: plan.billingCycle || 'monthly',
                isActive: plan.isActive !== false,
                isFeatured: !!plan.isFeatured,
                dashboardFeatures: plan.dashboardFeatures || {}
            });
        } else {
            setEditingPlan(null);
            setFormData({
                name: '',
                description: '',
                planType: 'basic',
                price: 0,
                billingCycle: 'monthly',
                isActive: true,
                isFeatured: false,
                dashboardFeatures: {}
            });
        }
    };

    const handleSave = async () => {
        try {
            setActionLoading('save');
            if (modalMode === 'create') {
                await api.admin.plans.create(formData);
            } else if (modalMode === 'edit' && editingPlan) {
                await api.admin.plans.update(editingPlan.id, formData);
            }
            await fetchPlans();
            setModalMode(null);
        } catch (err: any) {
            alert(err.message || 'Failed to save plan');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this plan? This may break existing subscriptions.')) return;
        try {
            setActionLoading(`delete-${id}`);
            await api.admin.plans.delete(id);
            setPlans(prev => prev.filter(p => p.id !== id));
        } catch (err: any) {
            alert(err.message || 'Failed to delete plan');
        } finally {
            setActionLoading(null);
        }
    };

    const handleFeatureToggle = (key: string) => {
        setFormData((prev: any) => ({
            ...prev,
            dashboardFeatures: {
                ...prev.dashboardFeatures,
                [key]: !prev.dashboardFeatures[key]
            }
        }));
    };

    const handleFeatureNumber = (key: string, value: string) => {
        setFormData((prev: any) => ({
            ...prev,
            dashboardFeatures: {
                ...prev.dashboardFeatures,
                [key]: value === '' ? undefined : parseInt(value, 10)
            }
        }));
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Subscription Plans</h1>
                    <p className="text-slate-500 font-bold mt-2">Manage billing tiers and feature gating.</p>
                </div>
                <button
                    onClick={() => handleOpenModal('create')}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    Create Plan
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 border border-red-100">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="font-bold text-sm">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {loading ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center">
                        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Plans...</p>
                    </div>
                ) : plans.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                        <p className="text-slate-400 font-bold text-lg mb-2">No plans configured yet.</p>
                        <button onClick={() => handleOpenModal('create')} className="text-blue-600 font-black hover:underline">Create your first plan</button>
                    </div>
                ) : (
                    plans.map(plan => (
                        <div key={plan.id} className={`bg-white rounded-3xl border-2 p-6 shadow-sm transition-all relative overflow-hidden ${plan.isFeatured ? 'border-amber-400 shadow-amber-500/10' : 'border-slate-100'}`}>
                            {plan.isFeatured && (
                                <div className="absolute top-4 right-4 bg-amber-100 text-amber-700 px-3 py-1 text-xs font-black rounded-lg uppercase tracking-wider">
                                    Featured
                                </div>
                            )}
                            <div className="mb-6">
                                <h3 className="text-2xl font-black text-slate-900 mb-1">{plan.name}</h3>
                                <p className="text-sm font-medium text-slate-500 line-clamp-2 min-h-[40px]">{plan.description || 'No description provided'}</p>
                            </div>
                            <div className="mb-6 pb-6 border-b border-slate-100">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-slate-900">PKR {Number(plan.price).toLocaleString()}</span>
                                    <span className="text-slate-400 font-bold">/{plan.billingCycle}</span>
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                    <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded ${plan.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {plan.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="mb-8">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Key Features ({Object.keys(plan.dashboardFeatures || {}).length})</p>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(plan.dashboardFeatures || {})
                                        .filter(([_, v]) => v !== false && v !== 0 && v !== undefined)
                                        .slice(0, 5)
                                        .map(([key, value]) => (
                                            <span key={key} className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold">
                                                {key}: {value === true ? 'Yes' : value as string}
                                            </span>
                                        ))}
                                    {Object.keys(plan.dashboardFeatures || {}).filter(k => plan.dashboardFeatures[k]).length > 5 && (
                                        <span className="px-2.5 py-1 bg-slate-50 text-slate-400 rounded-lg text-[10px] font-bold">...</span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-auto">
                                <button
                                    onClick={() => handleOpenModal('edit', plan)}
                                    className="flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-black text-sm transition-all"
                                >
                                    <Edit className="w-4 h-4" /> Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(plan.id)}
                                    disabled={actionLoading === `delete-${plan.id}`}
                                    className="flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-black text-sm transition-all disabled:opacity-50"
                                >
                                    {actionLoading === `delete-${plan.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <AnimatePresence>
                {modalMode && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900">{modalMode === 'create' ? 'Create Plan' : 'Edit Plan'}</h2>
                                    <p className="text-sm font-bold text-slate-500 mt-1">Configure plan details and dashboard features.</p>
                                </div>
                                <button onClick={() => setModalMode(null)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto flex-grow flex flex-col lg:flex-row gap-8">
                                {/* Left Col - Basic Details */}
                                <div className="w-full lg:w-1/3 flex flex-col gap-5">
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Plan Name</label>
                                        <input
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            placeholder="e.g. Pro Business"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Plan Type</label>
                                        <SearchableSelect
                                            value={formData.planType}
                                            onChange={val => setFormData({ ...formData, planType: val })}
                                            options={[
                                                { label: "Free", value: "free" },
                                                { label: "Basic", value: "basic" },
                                                { label: "Premium", value: "premium" },
                                                { label: "Enterprise", value: "enterprise" }
                                            ]}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-h-[100px] resize-y"
                                            placeholder="Brief description of the plan..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Price</label>
                                            <input
                                                type="number"
                                                value={formData.price}
                                                onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Billing Cycle</label>
                                            <SearchableSelect
                                                value={formData.billingCycle}
                                                onChange={val => setFormData({ ...formData, billingCycle: val })}
                                                options={[
                                                    { label: "Monthly", value: "monthly" },
                                                    { label: "Yearly", value: "yearly" },
                                                    { label: "Lifetime", value: "lifetime" }
                                                ]}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 mt-2">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <div className={`w-12 h-6 rounded-full transition-colors relative ${formData.isActive ? 'bg-blue-500' : 'bg-slate-200'}`}>
                                                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${formData.isActive ? 'left-7' : 'left-1'}`} />
                                            </div>
                                            <input type="checkbox" className="hidden" checked={formData.isActive} onChange={() => setFormData({ ...formData, isActive: !formData.isActive })} />
                                            <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900">Active</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <div className={`w-12 h-6 rounded-full transition-colors relative ${formData.isFeatured ? 'bg-amber-500' : 'bg-slate-200'}`}>
                                                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${formData.isFeatured ? 'left-7' : 'left-1'}`} />
                                            </div>
                                            <input type="checkbox" className="hidden" checked={formData.isFeatured} onChange={() => setFormData({ ...formData, isFeatured: !formData.isFeatured })} />
                                            <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900">Featured</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Right Col - Features */}
                                <div className="w-full lg:w-2/3 lg:border-l lg:border-slate-100 lg:pl-8">
                                    <h3 className="text-lg font-black text-slate-900 mb-6">Dashboard Features</h3>
                                    
                                    <div className="mb-8">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Numerical Limits</p>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                            {numberFeatures.map(feat => (
                                                <div key={feat} className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">{feat}</label>
                                                    <input
                                                        type="number"
                                                        value={formData.dashboardFeatures[feat] ?? ''}
                                                        onChange={(e) => handleFeatureNumber(feat, e.target.value)}
                                                        placeholder="Unlimited"
                                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Boolean Toggles</p>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {booleanFeatures.map(feat => {
                                                const isActive = !!formData.dashboardFeatures[feat];
                                                return (
                                                    <button
                                                        key={feat}
                                                        onClick={() => handleFeatureToggle(feat)}
                                                        className={`flex items-center gap-2 p-3 border rounded-xl text-left transition-all ${isActive ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                                                    >
                                                        {isActive ? <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-slate-300 flex-shrink-0" />}
                                                        <span className={`text-xs font-bold truncate ${isActive ? 'text-blue-900' : 'text-slate-500'}`}>{feat}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                                <button
                                    onClick={() => setModalMode(null)}
                                    className="px-6 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-sm hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={actionLoading === 'save' || !formData.name}
                                    className="flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 text-white rounded-xl font-black text-sm shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all disabled:opacity-50"
                                >
                                    {actionLoading === 'save' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    Save Plan
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
