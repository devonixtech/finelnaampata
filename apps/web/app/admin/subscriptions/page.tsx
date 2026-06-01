"use client";

import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { Loader2, Plus, AlertCircle, RefreshCw, XCircle, Search, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Modal state for assigning
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [assignForm, setAssignForm] = useState({
        vendorId: '',
        planId: '',
        durationDays: 30
    });
    
    // Select options
    const [plans, setPlans] = useState<any[]>([]);
    const [vendors, setVendors] = useState<any[]>([]); // Using getVendors
    const [searchVendor, setSearchVendor] = useState('');

    const fetchSubscriptions = async () => {
        try {
            setLoading(true);
            const response = await api.subscriptions.adminGetAll(1, 50);
            setSubscriptions(response?.data || response || []);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch subscriptions');
        } finally {
            setLoading(false);
        }
    };

    const fetchOptions = async () => {
        try {
            const [plansRes, vendorsRes] = await Promise.all([
                api.admin.plans.getAll(),
                api.admin.getVendors(1, 50)
            ]);
            setPlans(Array.isArray(plansRes) ? plansRes : []);
            setVendors(vendorsRes?.data || vendorsRes || []);
        } catch (err: any) {
            console.error('Failed to load options', err);
        }
    };

    useEffect(() => {
        fetchSubscriptions();
        fetchOptions();
    }, []);

    const handleAssign = async () => {
        try {
            setActionLoading('assign');
            await api.subscriptions.adminAssign({
                vendorId: assignForm.vendorId,
                planId: assignForm.planId,
                durationDays: assignForm.durationDays || undefined
            });
            setIsAssignModalOpen(false);
            setAssignForm({ vendorId: '', planId: '', durationDays: 30 });
            await fetchSubscriptions();
        } catch (err: any) {
            alert(err.message || 'Failed to assign plan');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancel = async (id: string) => {
        if (!confirm('Are you sure you want to cancel this subscription immediately?')) return;
        try {
            setActionLoading(`cancel-${id}`);
            await api.subscriptions.adminCancel(id);
            await fetchSubscriptions();
        } catch (err: any) {
            alert(err.message || 'Failed to cancel subscription');
        } finally {
            setActionLoading(null);
        }
    };

    const handleTriggerExpiry = async () => {
        try {
            setActionLoading('expiry');
            await api.subscriptions.adminTriggerExpiryCheck();
            alert('Expiry check triggered successfully.');
            await fetchSubscriptions();
        } catch (err: any) {
            alert(err.message || 'Failed to trigger expiry check');
        } finally {
            setActionLoading(null);
        }
    };

    const filteredVendors = vendors.filter(v => 
        (v.user?.firstName || '').toLowerCase().includes(searchVendor.toLowerCase()) || 
        (v.user?.email || '').toLowerCase().includes(searchVendor.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Active Subscriptions</h1>
                    <p className="text-slate-500 font-bold mt-2">Manage user plans, manual assignments, and expirations.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleTriggerExpiry}
                        disabled={actionLoading === 'expiry'}
                        className="flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-black hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {actionLoading === 'expiry' ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                        Sync Expirations
                    </button>
                    <button
                        onClick={() => setIsAssignModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        Assign Plan
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 border border-red-100">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="font-bold text-sm">{error}</p>
                </div>
            )}

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Vendor</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Plan</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Dates</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
                                        <p className="text-sm font-bold text-slate-400">Loading subscriptions...</p>
                                    </td>
                                </tr>
                            ) : subscriptions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Calendar className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <p className="text-slate-900 font-black text-lg">No active subscriptions</p>
                                    </td>
                                </tr>
                            ) : (
                                subscriptions.map((sub) => (
                                    <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-black text-slate-900">{sub.vendor?.user?.firstName || 'Unknown Vendor'}</p>
                                                <p className="text-xs font-bold text-slate-500">{sub.vendor?.user?.email || 'N/A'}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-black text-slate-900">{sub.plan?.name || 'Custom Plan'}</p>
                                                <p className="text-xs font-bold text-slate-500">Billing: {sub.plan?.billingCycle || 'N/A'}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg ${
                                                sub.status === 'active' ? 'bg-green-100 text-green-700' :
                                                sub.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                sub.status === 'expired' ? 'bg-slate-100 text-slate-500' :
                                                'bg-amber-100 text-amber-700'
                                            }`}>
                                                {sub.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-slate-600">
                                                <p>Start: {new Date(sub.startDate).toLocaleDateString()}</p>
                                                <p>End: {new Date(sub.endDate).toLocaleDateString()}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {sub.status === 'active' && (
                                                    <button
                                                        onClick={() => handleCancel(sub.id)}
                                                        disabled={actionLoading === `cancel-${sub.id}`}
                                                        className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all disabled:opacity-50"
                                                        title="Cancel Subscription"
                                                    >
                                                        {actionLoading === `cancel-${sub.id}` ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AnimatePresence>
                {isAssignModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl flex flex-col overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-100">
                                <h2 className="text-2xl font-black text-slate-900">Assign Subscription</h2>
                                <p className="text-sm font-bold text-slate-500 mt-1">Manually grant a plan to a vendor.</p>
                            </div>

                            <div className="p-6 space-y-5">
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Search Vendor</label>
                                    <div className="relative mb-3">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            value={searchVendor}
                                            onChange={e => setSearchVendor(e.target.value)}
                                            placeholder="Search by name or email..."
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <select
                                        value={assignForm.vendorId}
                                        onChange={e => setAssignForm({ ...assignForm, vendorId: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    >
                                        <option value="" disabled>Select Vendor</option>
                                        {filteredVendors.map(v => (
                                            <option key={v.id} value={v.id}>{v.user?.firstName || ''} ({v.user?.email || 'No email'})</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Select Plan</label>
                                    <select
                                        value={assignForm.planId}
                                        onChange={e => setAssignForm({ ...assignForm, planId: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    >
                                        <option value="" disabled>Select a Plan</option>
                                        {plans.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} - ${p.price}/{p.billingCycle}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Duration (Days)</label>
                                    <input
                                        type="number"
                                        value={assignForm.durationDays}
                                        onChange={e => setAssignForm({ ...assignForm, durationDays: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        min="1"
                                    />
                                    <p className="text-xs font-medium text-slate-400 mt-2">Leave at 30 for standard monthly.</p>
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                                <button
                                    onClick={() => setIsAssignModalOpen(false)}
                                    className="px-6 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-sm hover:bg-slate-100 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAssign}
                                    disabled={actionLoading === 'assign' || !assignForm.vendorId || !assignForm.planId}
                                    className="flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 text-white rounded-xl font-black text-sm shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all disabled:opacity-50"
                                >
                                    {actionLoading === 'assign' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                    Assign Plan
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
