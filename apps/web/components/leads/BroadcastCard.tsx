'use client';

import React from 'react';
import { JobLead } from '../../types/api';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, Clock, DollarSign, Megaphone, Send, User, CheckCircle2 } from 'lucide-react';

interface BroadcastCardProps {
    lead: JobLead;
    canRespond?: boolean;
    onRespond: (lead: JobLead) => void;
}

export default function BroadcastCard({ lead, canRespond = true, onRespond }: BroadcastCardProps) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all group relative overflow-hidden">
            {/* Proximity Indicator */}
            {lead.latitude && lead.longitude && (
                <div className="absolute top-0 right-0 px-3 py-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-bl-xl shadow-sm z-10 flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" /> Nearest Expert
                </div>
            )}

            <div className="flex justify-between items-start mb-5">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                            {lead.category?.name || 'General'}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                        </span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight mb-2 tracking-tight">
                        {lead.title}
                    </h3>
                    <div className="flex items-center gap-3 text-slate-500 font-bold text-xs">
                        <span className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {lead.city || 'Anywhere'}
                        </span>
                        {lead.budget && (
                            <span className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg">
                                <DollarSign className="w-3 h-3" />
                                {lead.budget.toLocaleString()}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6 line-clamp-3">
                {lead.description}
            </p>

            {/* Customer Info & Contact (For Businesses) */}
            {lead.user && (
                <div className="flex items-center justify-between mb-6 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 shadow-sm">
                            <User className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Customer</p>
                            <p className="text-sm font-black text-slate-900 leading-none">{lead.user.fullName}</p>
                        </div>
                    </div>
                    {lead.hasResponded && lead.user.phone && (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                const phone = lead.user!.phone!.replace(/\s+/g, '');
                                const waNumber = phone.startsWith('+') ? phone.substring(1) : phone;
                                window.open(`https://wa.me/${waNumber}`, '_blank');
                            }}
                            className="p-2.5 bg-white text-emerald-500 hover:text-white hover:bg-emerald-500 border border-emerald-100 rounded-xl transition-all shadow-sm group/wa"
                            title="WhatsApp Customer"
                        >
                            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                        </button>
                    )}
                </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${lead.hasResponded ? 'bg-indigo-500' : lead.status === 'open' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {lead.hasResponded ? 'Proposal Sent' : lead.status === 'open' ? 'Live Broadcast' : lead.status}
                    </span>
                </div>
                <button
                    onClick={() => onRespond(lead)}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs transition-all active:scale-95 shadow-lg ${
                        !canRespond && !lead.hasResponded
                        ? 'bg-orange-50 text-orange-700 hover:bg-orange-100 shadow-none'
                        : lead.hasResponded 
                        ? 'bg-slate-50 text-slate-600 hover:bg-slate-100 shadow-none' 
                        : 'bg-slate-900 text-white hover:bg-blue-600 shadow-slate-200'
                    }`}
                >
                    <span>{!canRespond && !lead.hasResponded ? 'Upgrade to Respond' : lead.hasResponded ? 'View Proposal' : 'Send Proposal'}</span>
                    {!lead.hasResponded ? <Send className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                </button>
            </div>
        </div>
    );
}
