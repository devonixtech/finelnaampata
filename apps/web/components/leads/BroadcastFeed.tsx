'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { JobLead } from '../../types/api';
import BroadcastCard from './BroadcastCard';
import { Megaphone, RefreshCcw, Send, CheckCircle2, X, DollarSign, Loader2, Lock } from 'lucide-react';
import { usePlanFeature } from '../../hooks/usePlanFeature';
import Link from 'next/link';

export default function BroadcastFeed() {
    const { hasFeature } = usePlanFeature();
    const canRespond = hasFeature('canRespondBroadcast');
    const [leads, setLeads] = useState<JobLead[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedLead, setSelectedLead] = useState<JobLead | null>(null);
    const [responseMessage, setResponseMessage] = useState('');
    const [responsePrice, setResponsePrice] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchLeads();
    }, []);

    useEffect(() => {
        if (selectedLead?.myResponse) {
            setResponseMessage(selectedLead.myResponse.message);
            setResponsePrice(selectedLead.myResponse.price?.toString() || '');
        } else {
            setResponseMessage('');
            setResponsePrice('');
        }
    }, [selectedLead]);

    const fetchLeads = async () => {
        try {
            setLoading(true);
            const data = await api.broadcasts.getVendorInbox();
            setLeads(data || []);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch broadcast feed');
        } finally {
            setLoading(false);
        }
    };

    const handleRespond = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLead) return;
        if (!canRespond) {
            alert('Responding to broadcast leads requires a paid plan. Upgrade to send proposals.');
            return;
        }

        setSubmitting(true);
        const priceValue = parseFloat(responsePrice);
        const leadId = selectedLead.id;

        try {
            await api.broadcasts.respond(leadId, {
                message: responseMessage,
                price: !isNaN(priceValue) ? priceValue : undefined,
            });

            // Optimistically update local state to reflect the response
            setLeads(currentLeads =>
                currentLeads.map(l =>
                    l.id === leadId ? { ...l, hasResponded: true } : l
                )
            );

            setSelectedLead(null);
            setResponseMessage('');
            setResponsePrice('');
            // Optional: fetchLeads() in background to stay in sync with server counts
            fetchLeads();
        } catch (err: any) {
            console.error('Response submission failed:', err);
            // Check if backend already had this response
            if (err.message && String(err.message).includes('Already responded')) {
                // If somehow frontend was out of sync, just handle it gracefully
                setLeads(currentLeads =>
                    currentLeads.map(l =>
                        l.id === leadId ? { ...l, hasResponded: true } : l
                    )
                );
                setSelectedLead(null);
            } else {
                alert(err.message || 'Failed to send response. Please check your connection and try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Scanning Broadcasts...</p>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center px-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                        <Megaphone className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Live Broadcasts</h2>
                        <p className="text-xs text-slate-400 font-bold">Real-time requests from nearby customers</p>
                    </div>
                </div>
                <button
                    onClick={fetchLeads}
                    className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all active:scale-95"
                    title="Refresh Feed"
                >
                    <RefreshCcw className="w-5 h-5" />
                </button>
            </div>

            {leads.length === 0 ? (
                <div className="bg-slate-50/50 p-20 rounded-[20px] border-2 border-dashed border-slate-100 text-center">
                    <div className="w-20 h-20 bg-white text-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <Megaphone className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">Feed is Quiet</h3>
                    <p className="text-slate-400 font-medium max-w-sm mx-auto mb-8">We'll notify you as soon as someone broadcasts a request in your area and category.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {leads.map(lead => (
                        <BroadcastCard
                            key={lead.id}
                            lead={lead}
                            canRespond={canRespond}
                            onRespond={setSelectedLead}
                        />
                    ))}
                </div>
            )}

            {/* Response Modal */}
            {selectedLead && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[24px] w-full max-w-lg overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
                        {!canRespond ? (
                            <div className="p-10 text-center">
                                <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Lock className="w-7 h-7 text-orange-500" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-2">Paid Feature</h3>
                                <p className="text-sm text-slate-500 font-medium mb-6">Free plans can view broadcasts but need a paid plan to send proposals.</p>
                                <Link href="/subscription" className="inline-flex px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-wider">
                                    Upgrade Plan
                                </Link>
                                <button onClick={() => setSelectedLead(null)} className="block w-full mt-4 text-xs font-bold text-slate-400">Close</button>
                            </div>
                        ) : (
                        <>
                        <div className="p-10 pb-0 flex justify-between items-start">
                            <div className="max-w-[80%]">
                                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 inline-block">Responding To</span>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{selectedLead.title}</h3>
                            </div>
                            <button
                                onClick={() => setSelectedLead(null)}
                                className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleRespond} className="p-10 space-y-8">
                            <div>
                                <label className="block text-sm font-black text-slate-700 mb-3 uppercase tracking-widest text-[10px]">Your Proposal</label>
                                <textarea
                                    required
                                    rows={4}
                                    placeholder="Tell the customer why they should choose you. Highlight your experience, availability, and how you can help..."
                                    className="w-full px-6 py-5 rounded-[24px] bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300 resize-none"
                                    value={responseMessage}
                                    onChange={(e) => setResponseMessage(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-black text-slate-700 mb-3 uppercase tracking-widest text-[10px]">Price Estimate (PKR)</label>
                                <div className="relative group">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">
                                        PKR
                                    </span>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        className="w-full pl-14 pr-6 py-5 rounded-[24px] bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-black text-slate-900 placeholder:text-slate-200"
                                        value={responsePrice}
                                        onChange={(e) => setResponsePrice(e.target.value)}
                                    />
                                </div>
                                <p className="mt-3 text-[10px] text-slate-400 font-bold italic">This is an estimate. Final pricing can be discussed once you connect.</p>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-3xl transition-all flex items-center justify-center gap-3 shadow-2xl shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50"
                            >
                                {submitting ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>
                                        <span className="uppercase tracking-[0.2em] text-sm">
                                            {selectedLead.hasResponded ? 'Update My Proposal' : 'Send Proposal Now'}
                                        </span>
                                        <Send className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>
                        </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
