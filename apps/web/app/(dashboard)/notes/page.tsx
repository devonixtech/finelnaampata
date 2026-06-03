"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api';
import {
    FileText, Search, Plus, Send, User, Clock, Loader2, MessageSquare,
    ChevronDown, ChevronUp, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';

interface Lead {
    id: string;
    name: string;
    email: string;
    phone: string;
    message: string;
    type: string;
    status: string;
    createdAt: string;
    business?: { name: string };
}

interface LeadNote {
    id: string;
    note: string;
    createdAt: string;
    createdBy?: { id?: string; fullName?: string; email?: string } | null;
}

export default function NotesPage() {
    const { user } = useAuth();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [notes, setNotes] = useState<LeadNote[]>([]);
    const [notesLoading, setNotesLoading] = useState(false);
    const [newNote, setNewNote] = useState('');
    const [addingNote, setAddingNote] = useState(false);
    const [expandedLeads, setExpandedLeads] = useState<Set<string>>(new Set());
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const fetchLeads = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.leads.getForBusiness({ status: statusFilter === 'all' ? undefined : statusFilter });
            setLeads(res?.data || res || []);
        } catch (e) {
            console.error('Failed to load leads', e);
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => { fetchLeads(); }, [fetchLeads]);

    const fetchNotes = async (leadId: string) => {
        try {
            setNotesLoading(true);
            const res = await api.leads.getNotes(leadId);
            setNotes(res || []);
        } catch (e) {
            console.error('Failed to load notes', e);
        } finally {
            setNotesLoading(false);
        }
    };

    const handleLeadClick = async (lead: Lead) => {
        setSelectedLead(lead);
        await fetchNotes(lead.id);
    };

    const handleAddNote = async () => {
        if (!selectedLead || !newNote.trim()) return;
        try {
            setAddingNote(true);
            await api.leads.addNote(selectedLead.id, newNote.trim());
            setNewNote('');
            await fetchNotes(selectedLead.id);
        } catch (e) {
            console.error('Failed to add note', e);
        } finally {
            setAddingNote(false);
        }
    };

    const toggleExpand = (leadId: string) => {
        setExpandedLeads(prev => {
            const next = new Set(prev);
            if (next.has(leadId)) next.delete(leadId);
            else next.add(leadId);
            return next;
        });
    };

    const filteredLeads = leads.filter(l =>
        l.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.message?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <FileText className="h-8 w-8 text-indigo-600" />
                        Customer Notes
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Private notes for customer follow-ups and CRM management
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Lead List */}
                    <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-200 space-y-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search customers..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="all">All Statuses</option>
                                <option value="new">New</option>
                                <option value="contacted">Contacted</option>
                                <option value="converted">Converted</option>
                                <option value="lost">Lost</option>
                            </select>
                        </div>
                        <div className="overflow-y-auto max-h-[600px]">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                                </div>
                            ) : filteredLeads.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                    <p>No customers found</p>
                                </div>
                            ) : (
                                filteredLeads.map(lead => (
                                    <div
                                        key={lead.id}
                                        onClick={() => handleLeadClick(lead)}
                                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-indigo-50 transition-colors ${
                                            selectedLead?.id === lead.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                                    <User className="h-4 w-4 text-indigo-600" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-gray-900 truncate">{lead.name}</p>
                                                    <p className="text-xs text-gray-500 truncate">{lead.email}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                lead.status === 'new' ? 'bg-blue-100 text-blue-700' :
                                                lead.status === 'contacted' ? 'bg-amber-100 text-amber-700' :
                                                lead.status === 'converted' ? 'bg-green-100 text-green-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {lead.status}
                                            </span>
                                        </div>
                                        {lead.business?.name && (
                                            <p className="text-xs text-gray-400 mt-1 truncate">Re: {lead.business.name}</p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Notes Panel */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {selectedLead ? (
                            <>
                                <div className="p-4 border-b border-gray-200 bg-gray-50">
                                    <h2 className="font-semibold text-gray-900">{selectedLead.name}</h2>
                                    <p className="text-sm text-gray-500">{selectedLead.email} {selectedLead.phone ? `• ${selectedLead.phone}` : ''}</p>
                                    <p className="text-sm text-gray-600 mt-1 italic">"{selectedLead.message}"</p>
                                </div>
                                <div className="p-4 border-b border-gray-200 max-h-[400px] overflow-y-auto">
                                    {notesLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                                        </div>
                                    ) : notes.length === 0 ? (
                                        <div className="text-center py-8 text-gray-400">
                                            <MessageSquare className="h-10 w-10 mx-auto mb-2" />
                                            <p>No notes yet. Add your first note below.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {notes.map(note => (
                                                <div key={note.id} className="bg-indigo-50 rounded-lg p-3">
                                                    <p className="text-sm text-gray-800">{note.note}</p>
                                                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                                        <Clock className="h-3 w-3" />
                                                        <span>{new Date(note.createdAt).toLocaleString()}</span>
                                                        {note.createdBy?.fullName && (
                                                            <span>• by {note.createdBy.fullName}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Add a private note..."
                                            value={newNote}
                                            onChange={e => setNewNote(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                        <button
                                            onClick={handleAddNote}
                                            disabled={addingNote || !newNote.trim()}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {addingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400">
                                <FileText className="h-16 w-16 mb-4" />
                                <p className="text-lg font-medium">Select a customer</p>
                                <p className="text-sm">Click on a customer to view and add notes</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
