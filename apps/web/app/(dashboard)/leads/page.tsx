"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api';
import {
    Phone, Mail, MessageSquare, Globe, Download, Filter,
    RefreshCw, TrendingUp, Users, CheckCircle, XCircle,
    PhoneCall, ChevronDown, Search, Eye, ChevronLeft, ChevronRight, Loader2, Lock, User, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import Link from 'next/link';
import { usePlanFeature } from '../../../hooks/usePlanFeature';
import { FeatureGate } from '../../../components/business/FeatureGate';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';

// ─── Types ────────────────────────────────────────────────────────────────────
type LeadStatus = 'new' | 'contacted' | 'converted' | 'lost';
type LeadType = 'call' | 'whatsapp' | 'email' | 'chat' | 'website';

interface Lead {
    id: string;
    name: string;
    email: string;
    phone: string;
    message: string;
    type: LeadType;
    status: LeadStatus;
    source: string;
    businessId: string;
    createdAt: string;
    notes?: string;
}

interface LeadNote {
    id: string;
    note: string;
    createdAt: string;
    createdBy?: {
        id?: string;
        fullName?: string;
        email?: string;
    } | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    new: { label: 'New', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: TrendingUp },
    contacted: { label: 'Contacted', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: PhoneCall },
    converted: { label: 'Converted', color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: CheckCircle },
    lost: { label: 'Lost', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: XCircle },
};

const TYPE_CONFIG: Record<LeadType, { label: string; icon: React.ElementType; color: string }> = {
    call: { label: 'Call', icon: Phone, color: 'text-indigo-600 bg-indigo-50' },
    whatsapp: { label: 'WhatsApp', icon: MessageSquare, color: 'text-green-600 bg-green-50' },
    email: { label: 'Email', icon: Mail, color: 'text-sky-600 bg-sky-50' },
    chat: { label: 'Chat', icon: MessageSquare, color: 'text-violet-600 bg-violet-50' },
    website: { label: 'Website', icon: Globe, color: 'text-slate-600 bg-slate-100' },
};

// ─── CSV Export ───────────────────────────────────────────────────────────────
function exportToCSV(leads: Lead[]) {
    const headers = ['Name', 'Email', 'Phone', 'Type', 'Status', 'Message', 'Date'];
    const rows = leads.map(l => [
        l.name || '',
        l.email || '',
        l.phone || '',
        l.type,
        l.status,
        (l.message || '').replace(/,/g, ';'),
        new Date(l.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: LeadStatus }) {
    const cfg = STATUS_CONFIG[status];
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.color}`}>
            <Icon className="w-3 h-3" />
            {cfg.label}
        </span>
    );
}

// ─── Type Badge ───────────────────────────────────────────────────────────────
function TypeBadge({ type }: { type: LeadType }) {
    const cfg = TYPE_CONFIG[type];
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${cfg.color}`}>
            <Icon className="w-3 h-3" />
            {cfg.label}
        </span>
    );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-2xl font-black text-slate-900">{value}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
            </div>
        </motion.div>
    );
}

// ─── Lead Row Detail Modal ────────────────────────────────────────────────────
function LeadDetailModal({ lead, onClose, onStatusChange }: {
    lead: Lead; onClose: () => void; onStatusChange: (id: string, status: LeadStatus) => void;
}) {
    const [updating, setUpdating] = useState(false);
    const [notes, setNotes] = useState<LeadNote[]>([]);
    const [notesLoading, setNotesLoading] = useState(true);
    const [noteDraft, setNoteDraft] = useState('');
    const [noteError, setNoteError] = useState('');
    const [savingNote, setSavingNote] = useState(false);

    useEffect(() => {
        let active = true;

        const fetchNotes = async () => {
            setNotesLoading(true);
            setNoteError('');
            try {
                const response = await api.leads.getNotes(lead.id);
                if (!active) return;
                setNotes(Array.isArray(response) ? response : []);
            } catch (error) {
                if (!active) return;
                console.error('Failed to load lead notes:', error);
                setNoteError('Unable to load internal notes right now.');
                setNotes([]);
            } finally {
                if (active) {
                    setNotesLoading(false);
                }
            }
        };

        fetchNotes();

        return () => {
            active = false;
        };
    }, [lead.id]);

    const handleStatus = async (status: LeadStatus) => {
        setUpdating(true);
        await onStatusChange(lead.id, status);
        setUpdating(false);
    };

    const handleSaveNote = async () => {
        const trimmed = noteDraft.trim();
        if (!trimmed) {
            setNoteError('Add a short internal note before saving.');
            return;
        }

        setSavingNote(true);
        setNoteError('');
        try {
            const savedNote = await api.leads.addNote(lead.id, trimmed);
            setNotes((prev) => [savedNote, ...prev]);
            setNoteDraft('');
        } catch (error) {
            console.error('Failed to save lead note:', error);
            setNoteError('Unable to save this note right now. Please try again.');
        } finally {
            setSavingNote(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-xl overflow-hidden z-10 border border-white/20">

                {/* Header with Background Gradient */}
                <div className="h-32 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 relative">
                    <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all active:scale-90">
                        <XCircle className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shadow-xl">
                            <User className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white">{lead.name || 'Anonymous User'}</h2>
                            <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-1">Lead Details</p>
                        </div>
                    </div>
                </div>

                <div className="p-10 -mt-6 bg-white rounded-t-[32px] relative z-20">
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex flex-col gap-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Inquiry Type</span>
                            <TypeBadge type={lead.type} />
                        </div>
                        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex flex-col gap-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Current Status</span>
                            <StatusBadge status={lead.status} />
                        </div>
                    </div>

                    <div className="space-y-6 mb-10">
                        <div className="flex items-center gap-5 p-5 bg-blue-50 rounded-3xl border border-blue-100 group">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-blue-600 group-hover:scale-110 transition-transform">
                                <Mail className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Email Address</span>
                                <a href={`mailto:${lead.email}`} className="text-sm font-black text-slate-900 hover:text-blue-600 transition-colors">{lead.email || '—'}</a>
                            </div>
                        </div>

                        <div className="flex items-center gap-5 p-5 bg-orange-50 rounded-3xl border border-orange-100 group">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-orange-600 group-hover:scale-110 transition-transform">
                                <Phone className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Phone Number</span>
                                <a href={`tel:${lead.phone}`} className="text-sm font-black text-slate-900 hover:text-orange-600 transition-colors">{lead.phone || '—'}</a>
                            </div>
                        </div>

                        {lead.message && (
                            <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 italic relative overflow-hidden group">
                                <MessageSquare className="absolute -right-4 -bottom-4 w-24 h-24 text-slate-200/50 -rotate-12 transition-transform group-hover:rotate-0" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-4 relative z-10">Message from User</span>
                                <p className="text-sm text-slate-600 leading-relaxed font-medium relative z-10">"{lead.message}"</p>
                            </div>
                        )}

                        <div className="flex items-center justify-between px-2">
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Received on {new Date(lead.createdAt).toLocaleDateString()} at {new Date(lead.createdAt).toLocaleTimeString()}</p>
                        </div>
                    </div>

                    <div className="mb-10 rounded-[32px] border border-slate-100 bg-slate-50 p-6">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Internal Notes</p>
                                <p className="text-sm font-medium text-slate-500 mt-2">
                                    Keep private follow-up notes for your team. Customers cannot see these notes.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
                                <Lock className="w-3.5 h-3.5 text-slate-400" />
                                Private
                            </div>
                        </div>

                        <div className="space-y-3 mb-4 max-h-56 overflow-y-auto pr-1">
                            {notesLoading ? (
                                <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-5 text-sm font-medium text-slate-500 border border-slate-100">
                                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                    Loading internal notes...
                                </div>
                            ) : notes.length > 0 ? (
                                notes.map((note) => (
                                    <div key={note.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                                        <div className="flex items-center justify-between gap-3 mb-2">
                                            <p className="text-xs font-black text-slate-700">
                                                {note.createdBy?.fullName || note.createdBy?.email || 'Business Team'}
                                            </p>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                                {new Date(note.createdAt).toLocaleDateString()} {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <p className="text-sm leading-relaxed text-slate-600">{note.note}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-5 text-sm font-medium text-slate-400">
                                    No internal notes yet. Add follow-up context here for your business team.
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <textarea
                                value={noteDraft}
                                onChange={(e) => {
                                    setNoteDraft(e.target.value);
                                    if (noteError) setNoteError('');
                                }}
                                rows={4}
                                maxLength={1000}
                                placeholder="Add a private note about next steps, callbacks, pricing, or customer context..."
                                className="w-full rounded-[24px] border border-slate-200 bg-white px-5 py-4 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 resize-none"
                            />
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    {noteError ? (
                                        <p className="text-sm font-bold text-red-500">{noteError}</p>
                                    ) : (
                                        <p className="text-xs font-medium text-slate-400">Notes are for your internal use.</p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSaveNote}
                                    disabled={savingNote}
                                    className="inline-flex items-center justify-center gap-2 rounded-[18px] bg-blue-600 px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-600/15 transition-all hover:bg-slate-900 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                                >
                                    {savingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    Save Note
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center">Action Center</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative">
                                <SearchableSelect
                                    value={lead.status}
                                    onChange={(val) => handleStatus(val as LeadStatus)}
                                    disabled={updating}
                                    options={(Object.keys(STATUS_CONFIG) as LeadStatus[]).map(s => ({
                                        label: STATUS_CONFIG[s].label,
                                        value: s
                                    }))}
                                />
                            </div>
                            <a href={`mailto:${lead.email}`} className="flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 shadow-xl shadow-slate-900/10">
                                <Mail className="w-4 h-4" /> Reply
                            </a>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function VendorLeadsPage() {
    const { user } = useAuth();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [stats, setStats] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const LIMIT = 15;

    // Filters
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterType, setFilterType] = useState('');

    const fetchLeads = useCallback(async (silent = false) => {
        if (!user) { setLoading(false); return; }
        if (!silent) setLoading(true); else setRefreshing(true);
        try {
            const isVendor = user.role === 'vendor';
            const isAdmin = user.role === 'admin' || user.role === 'superadmin';
            const params: any = { page, limit: LIMIT };
            if (filterStatus) params.status = filterStatus;
            if (filterType) params.type = filterType;

            const fetchPromises: Promise<any>[] = [
                (isVendor || isAdmin) 
                    ? api.leads.getForVendor(params) 
                    : api.leads.getMyEnquiries(params)
            ];

            if (isVendor) {
                fetchPromises.push(api.leads.getStats().catch(() => ({})));
            }

            const results = await Promise.allSettled(fetchPromises);
            const leadsRes = results[0];
            const statsRes = isVendor ? results[1] : null;

            if (leadsRes.status === 'fulfilled') {
                setLeads(leadsRes.value.data || []);
                setTotal(leadsRes.value.meta?.total || 0);
                setTotalPages(Math.ceil((leadsRes.value.meta?.total || 0) / LIMIT));
            } else {
                console.error('Failed to fetch leads list:', leadsRes.reason);
                setLeads([]);
            }

            if (statsRes && statsRes.status === 'fulfilled') {
                setStats(statsRes.value || {});
            } else if (statsRes) {
                console.warn('Failed to fetch lead stats:', statsRes.reason);
            }
        } catch (e) {
            console.error('Unexpected error in fetchLeads:', e);
            setLeads([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user, page, filterStatus, filterType]);

    useEffect(() => {
        fetchLeads();
    }, [user, fetchLeads]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [page]);

    const handleStatusChange = async (id: string, status: LeadStatus) => {
        try {
            await api.leads.updateStatus(id, status);
            setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
            if (selectedLead?.id === id) setSelectedLead(sl => sl ? { ...sl, status } : sl);
            setStats(prev => {
                const lead = leads.find(l => l.id === id);
                if (!lead) return prev;
                const next = { ...prev };
                next[lead.status] = Math.max(0, (next[lead.status] || 0) - 1);
                next[status] = (next[status] || 0) + 1;
                return next;
            });
        } catch (e) {
            console.error('Failed to update status:', e);
        }
    };

    const handleDownload = async () => {
        try {
            const all = await api.leads.getForVendor({ limit: 500, ...(filterStatus && { status: filterStatus }), ...(filterType && { type: filterType }) });
            exportToCSV(all.data || []);
        } catch (e) { console.error('Download failed:', e); }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-slate-400 font-bold text-sm">Loading leads…</p>
            </div>
        );
    }

    // Leads unlocked for all vendors as per user request.

    const filtered = leads.filter(l => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (l.name || '').toLowerCase().includes(q)
            || (l.email || '').toLowerCase().includes(q)
            || (l.phone || '').includes(q);
    });

    const statCards = [
        { label: 'Total Leads', value: total, icon: Users, color: 'bg-blue-50 text-blue-600' },
        { label: 'New', value: stats.new || 0, icon: TrendingUp, color: 'bg-indigo-50 text-indigo-600' },
        { label: 'Contacted', value: stats.contacted || 0, icon: PhoneCall, color: 'bg-amber-50 text-amber-600' },
        { label: 'Converted', value: stats.converted || 0, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
    ];

    return (
        <FeatureGate feature="showLeads" title="Manage Your Business Leads" description="Track and respond to customers who have expressed interest in your business. Gain professional insights into your customer base.">
            <div className="min-h-screen pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Leads</h1>
                        <p className="text-slate-400 font-bold mt-1">Track and manage all customer enquiries</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button id="refresh-leads-btn" onClick={() => fetchLeads(true)} disabled={refreshing}
                            className="p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm">
                            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                        <button id="download-leads-btn" onClick={handleDownload}
                            className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 active:scale-95 transition-all">
                            <Download className="w-4 h-4" />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {statCards.map(s => <StatCard key={s.label} {...s} />)}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input id="leads-search" type="text" placeholder="Search by name, email, phone…"
                            value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 text-sm font-medium bg-slate-50 rounded-xl border border-transparent focus:border-blue-400 focus:bg-white outline-none transition-all" />
                    </div>
                    <div className="relative w-[200px]">
                        <SearchableSelect
                            value={filterStatus}
                            onChange={(val) => { setFilterStatus(val); setPage(1); }}
                            options={[
                                { label: "All Statuses", value: "" },
                                ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ label: v.label, value: k }))
                            ]}
                        />
                    </div>
                    <div className="relative w-[200px]">
                        <SearchableSelect
                            value={filterType}
                            onChange={(val) => { setFilterType(val); setPage(1); }}
                            options={[
                                { label: "All Types", value: "" },
                                ...Object.entries(TYPE_CONFIG).map(([k, v]) => ({ label: v.label, value: k }))
                            ]}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-3">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
                                <Users className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-slate-400 font-bold">No leads found</p>
                            <p className="text-slate-300 text-sm">Leads appear here when customers contact your business</p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/50">
                                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Contact</th>
                                            <th className="px-4 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Type</th>
                                            <th className="px-4 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                                            <th className="px-4 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Message</th>
                                            <th className="px-4 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                                            <th className="px-4 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        <AnimatePresence>
                                            {filtered.map((lead, i) => (
                                                <motion.tr key={lead.id}
                                                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.03 }}
                                                    className="hover:bg-slate-50/70 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <p className="font-black text-slate-900 text-sm">{lead.name || '—'}</p>
                                                        {lead.email && <p className="text-xs text-slate-400 font-medium mt-0.5">{lead.email}</p>}
                                                        {lead.phone && (
                                                            <a href={`tel:${lead.phone}`} className="text-xs text-blue-500 font-bold mt-0.5 block hover:underline">
                                                                {lead.phone}
                                                            </a>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4"><TypeBadge type={lead.type} /></td>
                                                    <td className="px-4 py-4">
                                                        <div className="w-[140px] mt-0.5">
                                                            <SearchableSelect
                                                                value={lead.status}
                                                                onChange={(val) => handleStatusChange(lead.id, val as LeadStatus)}
                                                                options={(Object.keys(STATUS_CONFIG) as LeadStatus[]).map(s => ({
                                                                    label: STATUS_CONFIG[s].label,
                                                                    value: s
                                                                }))}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 max-w-[200px]">
                                                        <p className="text-sm text-slate-500 truncate">{lead.message || '—'}</p>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <p className="text-xs text-slate-400 font-medium whitespace-nowrap">
                                                            {new Date(lead.createdAt).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <button id={`view-lead-${lead.id}`} onClick={() => setSelectedLead(lead)}
                                                            className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100">
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile cards */}
                            <div className="md:hidden divide-y divide-slate-50">
                                {filtered.map(lead => (
                                    <div key={lead.id} className="p-4 flex items-start gap-4" onClick={() => setSelectedLead(lead)}>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <TypeBadge type={lead.type} />
                                                <StatusBadge status={lead.status} />
                                            </div>
                                            <p className="font-black text-slate-900 text-sm">{lead.name || '—'}</p>
                                            {lead.phone && <p className="text-xs text-blue-500 font-bold">{lead.phone}</p>}
                                            {lead.message && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{lead.message}</p>}
                                            <p className="text-[10px] text-slate-300 font-medium mt-1">{new Date(lead.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <Eye className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                            <p className="text-xs text-slate-400 font-medium">
                                Page {page} of {totalPages} · {total} total
                            </p>
                            <div className="flex items-center gap-2">
                                <button id="leads-prev-page" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                    className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:border-slate-300 disabled:opacity-40 transition-all">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button id="leads-next-page" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                    className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:border-slate-300 disabled:opacity-40 transition-all">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Detail Modal */}
                <AnimatePresence>
                    {selectedLead && (
                        <LeadDetailModal
                            lead={selectedLead}
                            onClose={() => setSelectedLead(null)}
                            onStatusChange={handleStatusChange}
                        />
                    )}
                </AnimatePresence>
            </div>
        </FeatureGate>
    );
}

