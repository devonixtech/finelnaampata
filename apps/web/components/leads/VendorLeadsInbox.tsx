'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Phone, Mail, MessageSquare, Globe, Clock, ChevronRight, User, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface Lead {
    id: string;
    name: string;
    email: string;
    phone: string;
    message: string;
    type: 'call' | 'whatsapp' | 'email' | 'chat' | 'website';
    status: 'new' | 'contacted' | 'converted' | 'lost';
    createdAt: string;
}

const TYPE_CONFIG = {
    call: { icon: Phone, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    whatsapp: { icon: MessageSquare, color: 'text-green-600', bg: 'bg-green-50' },
    email: { icon: Mail, color: 'text-sky-600', bg: 'bg-sky-50' },
    chat: { icon: MessageSquare, color: 'text-violet-600', bg: 'bg-violet-50' },
    website: { icon: Globe, color: 'text-slate-600', bg: 'bg-slate-50' },
};

export default function BusinessLeadsInbox() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchRecentLeads();
    }, []);

    const fetchRecentLeads = async () => {
        try {
            setLoading(true);
            const response = await api.leads.getForVendor({ limit: 5 });
            setLeads(response.data || []);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch leads');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Fetching Latest Leads...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 bg-red-50 rounded-3xl border-2 border-dashed border-red-100 text-center">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                <p className="text-red-700 font-black tracking-tight">{error}</p>
                <button onClick={fetchRecentLeads} className="mt-4 text-sm font-bold text-red-600 hover:underline px-4 py-2 bg-white rounded-xl shadow-sm">Try Again</button>
            </div>
        );
    }

    if (leads.length === 0) {
        return (
            <div className="p-12 bg-slate-50/50 rounded-[20px] border-2 border-dashed border-slate-100 text-center">
                <div className="w-16 h-16 bg-white text-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <User className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-1">No Leads Found</h3>
                <p className="text-slate-400 text-sm font-medium mb-6">Start growing your business to see leads here.</p>
                <Link href="/leads" className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-all active:scale-95 shadow-sm">
                    View Lead Center
                    <ChevronRight className="w-4 h-4" />
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-[14px] flex items-center justify-center text-orange-600">
                        <Phone className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Recent Leads</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">Direct Enquiries</p>
                    </div>
                </div>
                <button
                    onClick={fetchRecentLeads}
                    className="p-2 text-slate-300 hover:text-blue-600 transition-colors"
                    title="Refresh Leads"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            <div className="space-y-3">
                {leads.map((lead) => {
                    const Config = TYPE_CONFIG[lead.type] || TYPE_CONFIG.website;
                    const Icon = Config.icon;

                    return (
                        <Link
                            key={lead.id}
                            href="/leads"
                            className="group flex items-center gap-4 p-4 bg-slate-50/50 hover:bg-white rounded-[24px] border-2 border-transparent hover:border-slate-100 transition-all active:scale-[0.99] hover:shadow-xl hover:shadow-slate-200/50"
                        >
                            <div className={`w-12 h-12 ${Config.bg} ${Config.color} rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110`}>
                                <Icon className="w-6 h-6" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                    <h4 className="font-black text-slate-900 truncate tracking-tight">{lead.name || 'Anonymous User'}</h4>
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1 flex-shrink-0">
                                        <Clock className="w-3 h-3" />
                                        {new Date(lead.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 font-bold truncate group-hover:text-slate-600 transition-colors">
                                    {lead.message || 'Interested in your services'}
                                </p>
                            </div>

                            <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-blue-600 group-hover:border-blue-100 transition-all fle-shrink-0">
                                <ChevronRight className="w-4 h-4" />
                            </div>
                        </Link>
                    );
                })}

                <Link
                    href="/leads"
                    className="flex items-center justify-center gap-2 p-4 text-xs font-black text-slate-400 hover:text-blue-600 uppercase tracking-[.2em] transition-all group pt-2"
                >
                    See All Leads
                    <div className="w-6 h-6 bg-slate-50 rounded-lg flex items-center justify-center group-hover:bg-blue-50 transition-all">
                        <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                    </div>
                </Link>
            </div>
        </div>
    );
}
