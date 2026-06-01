'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { JobLead, JobLeadResponse } from '../../types/api';
import { formatDistanceToNow } from 'date-fns';
import { Megaphone, MessageSquare, CheckCircle2, Clock, MapPin, Phone, User, ArrowRight, Loader2, Zap } from 'lucide-react';

export default function MyJobLeads() {
    const [leads, setLeads] = useState<JobLead[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLead, setSelectedLead] = useState<JobLead | null>(null);

    useEffect(() => {
        fetchMyLeads();
    }, []);

    const fetchMyLeads = async () => {
        try {
            setLoading(true);
            const data = await api.broadcasts.getMyLeads();
            setLeads(data || []);
        } catch (err: any) {
            console.error('Failed to fetch my leads', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Loading your broadcasts...</p>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center px-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                        <Zap className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">My Broadcasts</h2>
                        <p className="text-xs text-slate-400 font-bold">Manage your active service requests</p>
                    </div>
                </div>
            </div>

            {leads.length === 0 ? (
                <div className="bg-slate-50/50 p-20 rounded-[20px] border-2 border-dashed border-slate-100 text-center">
                    <div className="w-20 h-20 bg-white text-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <Megaphone className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">No active broadcasts</h3>
                    <p className="text-slate-400 font-medium max-w-sm mx-auto mb-8">Need a pro? Send a broadcast and get responses from nearby experts instantly.</p>
                    <a href="/broadcast-request" className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-500/20">
                        Start New Broadcast <ArrowRight className="w-4 h-4" />
                    </a>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {leads.map(lead => (
                        <div
                            key={lead.id}
                            className="bg-white p-8 rounded-[20px] border-2 border-slate-50 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all cursor-pointer group"
                            onClick={() => setSelectedLead(lead)}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                            {lead.category?.name || 'General'}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${lead.status === 'closed' ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-600'
                                            }`}>
                                            {lead.status === 'open' ? 'Live & Active' : lead.status}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight tracking-tight">{lead.title}</h3>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-2xl text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                                    <ArrowRight className="w-5 h-5" />
                                </div>
                            </div>

                            <div className="flex items-center gap-6 pt-6 border-t border-slate-50">
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                    <Clock className="w-3.5 h-3.5" />
                                    {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-blue-600 font-black uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-full">
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    {lead.responses?.length || 0} Expert Responses
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Responses Modal */}
            {selectedLead && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-2 sm:p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[24px] w-full max-w-2xl overflow-hidden shadow-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-10 duration-500">
                        <div className="p-6 sm:p-10 pb-4 sm:pb-6 border-b border-slate-50 flex justify-between items-start bg-slate-50/30">
                            <div className="min-w-0 pr-4">
                                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 inline-block">Expert Responses for</span>
                                <h3 className="font-black text-slate-900 text-lg sm:text-2xl tracking-tight leading-tight truncate sm:whitespace-normal">{selectedLead.title}</h3>
                            </div>
                            <button
                                onClick={() => setSelectedLead(null)}
                                className="p-2 sm:p-3 bg-white rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all border border-slate-100 shrink-0"
                            >
                                <X className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 sm:p-10 space-y-6 sm:space-y-8 custom-scrollbar">
                            {selectedLead.responses && selectedLead.responses.length > 0 ? (
                                selectedLead.responses.map(resp => (
                                    <div key={resp.id} className="bg-white p-5 sm:p-8 rounded-[20px] border-2 border-slate-50 hover:border-blue-100 transition-all shadow-sm">
                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-600 text-white rounded-[18px] sm:rounded-[20px] flex items-center justify-center font-black text-lg sm:text-xl shadow-lg shadow-blue-200 shrink-0">
                                                    {resp.vendor?.businessName?.charAt(0) || 'B'}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-black text-slate-900 text-base sm:text-lg leading-tight mb-1 truncate">{resp.vendor?.businessName}</h4>
                                                    <div className="flex flex-wrap items-center gap-2 text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                        <div className="flex items-center gap-1">
                                                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                            <span>Business Expert</span>
                                                        </div>
                                                        <span className="hidden sm:inline">•</span>
                                                        <span>{formatDistanceToNow(new Date(resp.createdAt), { addSuffix: true })}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {resp.price && (
                                                <div className="sm:text-right w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-50">
                                                    <p className="text-[9px] sm:text-[10px] text-slate-300 uppercase font-black tracking-widest mb-1">Expert Quote</p>
                                                    <p className="text-xl sm:text-2xl font-black text-blue-600 tracking-tighter">PKR {resp.price.toLocaleString()}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="bg-slate-50/50 p-4 sm:p-6 rounded-2xl mb-6 sm:mb-8 relative">
                                            <div className="absolute -top-3 left-4 sm:left-6 px-2 bg-white text-[9px] font-black text-slate-300 uppercase tracking-widest border border-slate-50 rounded">Expert Message</div>
                                            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed italic">"{resp.message}"</p>
                                        </div>

                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => {
                                                    const phone = resp.vendor?.businessPhone || resp.vendor?.user?.phone;
                                                    if (phone) {
                                                        const cleanPhone = phone.replace(/\s+/g, '');
                                                        const waNumber = cleanPhone.startsWith('+') ? cleanPhone.substring(1) : cleanPhone;
                                                        window.open(`https://wa.me/${waNumber}`, '_blank');
                                                    } else {
                                                        alert('No contact phone available for this expert.');
                                                    }
                                                }}
                                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
                                            >
                                                <Phone className="w-4 h-4" /> Contact Business Now
                                            </button>
                                            <button className="px-6 py-4 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 font-black rounded-2xl transition-all active:scale-[0.95]">
                                                Decline
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-20 text-slate-300 bg-slate-50/30 rounded-[24px] border-2 border-dashed border-slate-100">
                                    <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 opacity-20" />
                                    <p className="font-black uppercase tracking-[0.2em] text-[10px]">Awaiting Expert Responses...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const X = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l18 18" />
    </svg>
);
