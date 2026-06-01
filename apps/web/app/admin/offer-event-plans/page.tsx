"use client";

import React, { useState, useEffect } from 'react';
import {
    Gift,
    Calendar,
    Plus,
    Search,
    Filter,
    MoreVertical,
    Edit2,
    Trash2,
    CheckCircle2,
    XCircle,
    Zap,
    Clock,
    LayoutGrid,
    Tag,
    Loader2,
    RefreshCcw,
    AlertCircle
} from 'lucide-react';
import { api } from '../../../lib/api';
import { toast } from 'react-hot-toast';
import { Badge } from '../../../components/ui/Badge';

interface PricingPlan {
    id: string;
    name: string;
    description: string;
    type: string;
    price: number;
    duration: number;
    unit: string;
    isActive: boolean;
    features: any;
}

const OfferEventPlansPage = () => {
    const [plans, setPlans] = useState<PricingPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'offer' | 'event'>('offer');

    // Form State
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        description: '',
        type: 'homepage_featured',
        boostType: 'offer', // Internal toggle for Offer vs Event
        price: '',
        duration: '',
        unit: 'hours',
        isActive: true,
        placements: {
            home: true,
            category: false,
            listing: false
        }
    });

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const data = await api.admin.pricingPlans.getAll();
            setPlans(data);
        } catch (error) {
            console.error('Failed to fetch plans:', error);
            toast.error('Failed to load plans.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.price || !formData.duration) {
            toast.error('Please fill in all required fields.');
            return;
        }

        try {
            setIsSubmitting(true);

            // Map boostType and placements to the entity structure if needed
            // For now, we'll just send the flat object
            const payload = {
                name: formData.name,
                description: formData.description,
                type: formData.type, // e.g. 'homepage_featured'
                price: parseFloat(formData.price),
                duration: parseInt(formData.duration),
                unit: formData.unit,
                isActive: formData.isActive,
                features: {
                    placements: formData.placements,
                    boostType: formData.boostType // offer or event
                }
            };

            if (formData.id) {
                await api.admin.pricingPlans.update(formData.id, payload);
                toast.success('Plan updated successfully.');
            } else {
                await api.admin.pricingPlans.create(payload);
                toast.success('Plan created successfully.');
            }

            resetForm();
            fetchPlans();
        } catch (error) {
            console.error('Failed to save plan:', error);
            toast.error('Failed to save plan.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (plan: PricingPlan) => {
        setFormData({
            id: plan.id,
            name: plan.name,
            description: plan.description || '',
            type: plan.type,
            boostType: plan.features?.boostType || 'offer',
            price: plan.price.toString(),
            duration: plan.duration.toString(),
            unit: plan.unit,
            isActive: plan.isActive,
            placements: plan.features?.placements || { home: true, category: false, listing: false }
        });

        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this plan?')) return;

        try {
            await api.admin.pricingPlans.delete(id);
            toast.success('Plan deleted successfully.');
            fetchPlans();
        } catch (error) {
            toast.error('Failed to delete plan.');
        }
    };

    const resetForm = () => {
        setFormData({
            id: '',
            name: '',
            description: '',
            type: 'homepage_featured',
            boostType: 'offer',
            price: '',
            duration: '',
            unit: 'hours',
            isActive: true,
            placements: {
                home: true,
                category: false,
                listing: false
            }
        });
    };

    const filteredPlans = plans.filter(p => (p.features?.boostType || 'offer') === activeTab);

    return (
        <div className="p-6 space-y-8 min-h-screen text-gray-900 bg-gray-50/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
                        <Gift className="w-8 h-8 text-indigo-600" />
                        Offer & Event Plans
                    </h1>
                    <p className="text-gray-500 mt-1">Manage monetization packages for promotional boosts.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchPlans}
                        className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-gray-900 shadow-sm transition-colors"
                    >
                        <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-indigo-50 rounded-xl">
                            <Tag className="w-6 h-6 text-indigo-600" />
                        </div>
                        <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100">Total</Badge>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{plans.filter(p => (p.features?.boostType || 'offer') === 'offer').length}</div>
                    <p className="text-gray-500 text-sm mt-1">Offer Pricing Plans</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-50 rounded-xl">
                            <Calendar className="w-6 h-6 text-purple-600" />
                        </div>
                        <Badge className="bg-purple-50 text-purple-600 border-purple-100">Total</Badge>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{plans.filter(p => (p.features?.boostType || 'offer') === 'event').length}</div>
                    <p className="text-gray-500 text-sm mt-1">Event Pricing Plans</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-emerald-50 rounded-xl">
                            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100">Active</Badge>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{plans.filter(p => p.isActive).length}</div>
                    <p className="text-gray-500 text-sm mt-1">Active Packages</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Package Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm sticky top-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-900">
                                {formData.id ? <Edit2 className="w-5 h-5 text-indigo-600" /> : <Plus className="w-5 h-5 text-indigo-600" />}
                                {formData.id ? 'Edit Package' : 'New Package'}
                            </h2>
                            {formData.id && (
                                <button
                                    onClick={resetForm}
                                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline"
                                >
                                    Cancel Edit
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Type Toggle */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 uppercase tracking-wider">Package Target</label>
                                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-50 rounded-xl border border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, boostType: 'offer' })}
                                        className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${formData.boostType === 'offer' ? 'bg-white text-indigo-600 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Offers
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, boostType: 'event' })}
                                        className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${formData.boostType === 'event' ? 'bg-white text-indigo-600 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Events
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Package Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. 24 Hour Flash Boost"
                                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Price (PKR)</label>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        placeholder="0.00"
                                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Status</label>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                        className={`w-full py-3 px-4 rounded-xl text-sm font-medium border transition-all flex items-center justify-center gap-2 ${formData.isActive ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}
                                    >
                                        {formData.isActive ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                        {formData.isActive ? 'Enabled' : 'Disabled'}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Duration</label>
                                    <input
                                        type="number"
                                        value={formData.duration}
                                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                        placeholder="1"
                                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Unit</label>
                                    <select
                                        value={formData.unit}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all appearance-none"
                                    >
                                        <option value="hours">Hours</option>
                                        <option value="days">Days</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-700">Placements Included</label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 transition-all shadow-sm">
                                        <input
                                            type="checkbox"
                                            checked={formData.placements.home}
                                            onChange={(e) => setFormData({ ...formData, placements: { ...formData.placements, home: e.target.checked } })}
                                            className="w-5 h-5 border-gray-300 rounded text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm font-medium text-gray-800">Home Page Spotlight</span>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 transition-all shadow-sm">
                                        <input
                                            type="checkbox"
                                            checked={formData.placements.category}
                                            onChange={(e) => setFormData({ ...formData, placements: { ...formData.placements, category: e.target.checked } })}
                                            className="w-5 h-5 border-gray-300 rounded text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm font-medium text-gray-800">Category Dominance</span>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 transition-all shadow-sm">
                                        <input
                                            type="checkbox"
                                            checked={formData.placements.listing}
                                            onChange={(e) => setFormData({ ...formData, placements: { ...formData.placements, listing: e.target.checked } })}
                                            className="w-5 h-5 border-gray-300 rounded text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm font-medium text-gray-800">Related Listings Boost</span>
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                {formData.id ? 'Update Package' : 'Create Package'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Plans List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
                                <button
                                    onClick={() => setActiveTab('offer')}
                                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'offer' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Offer Plans
                                </button>
                                <button
                                    onClick={() => setActiveTab('event')}
                                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'event' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Event Plans
                                </button>
                            </div>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search plans..."
                                    className="bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 w-full md:w-64"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                                        <th className="px-6 py-4 font-medium">Package Info</th>
                                        <th className="px-6 py-4 font-medium">Type</th>
                                        <th className="px-6 py-4 font-medium">Price</th>
                                        <th className="px-6 py-4 font-medium">Duration</th>
                                        <th className="px-6 py-4 font-medium">Status</th>
                                        <th className="px-6 py-4 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-600" />
                                                Loading packages...
                                            </td>
                                        </tr>
                                    ) : filteredPlans.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center gap-2">
                                                    <AlertCircle className="w-12 h-12 text-gray-400" />
                                                    <p className="text-gray-900 font-medium">No {activeTab} plans found.</p>
                                                    <p className="text-sm">Use the form to create your first boost package.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredPlans.map((plan) => (
                                            <tr key={plan.id} className="hover:bg-gray-50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{plan.name}</div>
                                                    <div className="text-xs text-gray-500 truncate max-w-xs">{plan.description || 'No description'}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge className="bg-gray-100 border-gray-200 text-gray-700 capitalize">
                                                        {plan.type?.replace('_', ' ')}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-semibold text-emerald-600">Rs. {plan.price.toLocaleString()}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-gray-600 font-medium">
                                                        <Clock className="w-4 h-4 text-gray-400" />
                                                        {plan.duration} {plan.unit}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge className={plan.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}>
                                                        {plan.isActive ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleEdit(plan)}
                                                            className="p-2 hover:bg-indigo-50 rounded-lg text-gray-400 hover:text-indigo-600 transition-all border border-transparent hover:border-indigo-100"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(plan.id)}
                                                            className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-all border border-transparent hover:border-red-100"
                                                        >
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

                    <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-6 flex gap-4 items-start shadow-sm">
                        <Zap className="w-6 h-6 text-indigo-600 shrink-0 mt-1" />
                        <div>
                            <h3 className="font-semibold text-indigo-900">Boost Engine Note</h3>
                            <p className="text-sm text-indigo-700/80 mt-1 leading-relaxed">
                                Packages defined here will be available to businesses when booking promotions.
                                Each package includes specific placements and a fixed duration.
                                Prices are in PKR and handled via Stripe.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OfferEventPlansPage;
