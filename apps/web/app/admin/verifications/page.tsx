"use client";

import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { Loader2, CheckCircle, XCircle, Eye, AlertCircle, Building2, MapPin } from 'lucide-react';
import { Business } from '../../../types/api';
import { ListingImage } from '../../../components/ListingImage';
import Link from 'next/link';

export default function VerificationsPage() {
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchPending = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.admin.getBusinesses(1, 50, 'pending');
            setBusinesses(response.data || []);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch pending verifications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const handleModerate = async (id: string, status: 'approved' | 'rejected') => {
        if (!confirm(`Are you sure you want to mark this business as ${status}?`)) return;
        try {
            setActionLoading(`${id}-${status}`);
            await api.admin.moderateBusiness(id, status);
            setBusinesses(prev => prev.filter(b => b.id !== id));
        } catch (err: any) {
            alert(err.message || `Failed to mark as ${status}`);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Verifications</h1>
                <p className="text-slate-500 font-bold mt-2">Manage pending business listings waiting for approval.</p>
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
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Business</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Submitted</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
                                        <p className="text-sm font-bold text-slate-400">Loading pending listings...</p>
                                    </td>
                                </tr>
                            ) : businesses.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle className="w-8 h-8 text-green-500" />
                                        </div>
                                        <p className="text-slate-900 font-black text-lg">All caught up!</p>
                                        <p className="text-sm font-bold text-slate-400 mt-1">No pending listings to review.</p>
                                    </td>
                                </tr>
                            ) : (
                                businesses.map((biz) => (
                                    <tr key={biz.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                                                    {biz.coverImageUrl ? (
                                                        <ListingImage src={biz.coverImageUrl} alt={biz.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Building2 className="w-6 h-6 text-slate-400 m-3" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900">{biz.title}</p>
                                                    <p className="text-xs font-bold text-slate-500">{biz.category?.name || 'Uncategorized'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <MapPin className="w-4 h-4 text-slate-400" />
                                                <span className="font-bold text-sm">{biz.city || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-slate-600">
                                                {new Date(biz.createdAt).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link 
                                                    href={`/business/${biz.slug}`} 
                                                    target="_blank"
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                    title="Preview Listing"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </Link>
                                                <button
                                                    onClick={() => handleModerate(biz.id, 'approved')}
                                                    disabled={!!actionLoading}
                                                    className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-xl transition-all disabled:opacity-50"
                                                    title="Approve"
                                                >
                                                    {actionLoading === `${biz.id}-approved` ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                                                </button>
                                                <button
                                                    onClick={() => handleModerate(biz.id, 'rejected')}
                                                    disabled={!!actionLoading}
                                                    className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all disabled:opacity-50"
                                                    title="Reject"
                                                >
                                                    {actionLoading === `${biz.id}-rejected` ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
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
        </div>
    );
}
