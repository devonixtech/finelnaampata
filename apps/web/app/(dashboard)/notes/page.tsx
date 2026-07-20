"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { chatApi } from '../../../services/chat.service';
import { getImageUrl } from '../../../lib/api';
import {
    FileText,
    Search,
    Send,
    User,
    Clock,
    Loader2,
    MessageSquare,
    Lock,
} from 'lucide-react';
import Link from 'next/link';
import { usePlanFeature } from '../../../hooks/usePlanFeature';

interface ConversationNote {
    id: string;
    content: string;
    createdAt: string;
    createdByUser?: {
        id?: string;
        fullName?: string;
        email?: string;
    } | null;
}

interface ConversationCustomer {
    id?: string;
    fullName?: string;
    email?: string;
    avatarUrl?: string | null;
    isOnline?: boolean;
}

interface ConversationBusiness {
    id?: string;
    title?: string;
    logoUrl?: string | null;
}

interface Conversation {
    id: string;
    lastMessage?: string | null;
    lastMessageAt?: string | null;
    user?: ConversationCustomer | null;
    business?: ConversationBusiness | null;
}

export default function NotesPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [notes, setNotes] = useState<ConversationNote[]>([]);
    const [notesLoading, setNotesLoading] = useState(false);
    const [newNote, setNewNote] = useState('');
    const [addingNote, setAddingNote] = useState(false);
    const [notesError, setNotesError] = useState('');
    const { hasFeature, loading: planLoading } = usePlanFeature();

    useEffect(() => {
        let active = true;

        const fetchConversations = async () => {
            try {
                setLoading(true);
                const response = await chatApi.getBusinessConversations();
                const list = Array.isArray(response) ? response : [];

                if (!active) return;

                setConversations(list);
                if (list.length > 0) {
                    setSelectedConversation((current) => {
                        if (current && list.some((item) => item.id === current.id)) {
                            return list.find((item) => item.id === current.id) || current;
                        }
                        return list[0];
                    });
                } else {
                    setSelectedConversation(null);
                }
            } catch (error) {
                if (!active) return;
                console.error('Failed to load customer conversations for notes', error);
                setConversations([]);
                setSelectedConversation(null);
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        fetchConversations();

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        let active = true;

        const fetchNotes = async () => {
            if (!selectedConversation?.id) {
                setNotes([]);
                return;
            }

            try {
                setNotesLoading(true);
                setNotesError('');
                const response = await chatApi.getNotes(selectedConversation.id);
                if (!active) return;
                setNotes(Array.isArray(response) ? response : []);
            } catch (error: any) {
                if (!active) return;
                console.error('Failed to load private customer notes', error);
                setNotes([]);
                setNotesError(error?.message || 'Unable to load private notes right now.');
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
    }, [selectedConversation?.id]);

    const handleAddNote = async () => {
        const trimmed = newNote.trim();
        if (!selectedConversation?.id || !trimmed || addingNote) return;

        try {
            setAddingNote(true);
            setNotesError('');
            const saved = (await chatApi.createNote(selectedConversation.id, trimmed)) as ConversationNote;
            setNotes((prev) => [saved, ...prev]);
            setNewNote('');
        } catch (error: any) {
            console.error('Failed to add private customer note', error);
            setNotesError(error?.message || 'Unable to save this private note right now.');
        } finally {
            setAddingNote(false);
        }
    };

    const filteredConversations = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return conversations;

        return conversations.filter((conversation) => {
            const customerName = conversation.user?.fullName?.toLowerCase() || '';
            const customerEmail = conversation.user?.email?.toLowerCase() || '';
            const businessTitle = conversation.business?.title?.toLowerCase() || '';
            const lastMessage = conversation.lastMessage?.toLowerCase() || '';

            return (
                customerName.includes(query) ||
                customerEmail.includes(query) ||
                businessTitle.includes(query) ||
                lastMessage.includes(query)
            );
        });
    }, [conversations, searchQuery]);

    const selectedCustomerName =
        selectedConversation?.user?.fullName ||
        selectedConversation?.user?.email ||
        'Customer conversation';

    const selectedCustomerAvatar = getImageUrl(selectedConversation?.user?.avatarUrl || undefined);

    if (planLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    if (!hasFeature('showCustomerNotes')) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh]">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                    <Lock className="w-10 h-10 text-slate-400" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-3">Premium Feature</h2>
                <p className="text-slate-500 mb-8 text-center max-w-md">
                    Customer Notes is a premium feature. Upgrade your plan to unlock private follow-up notes and relationship management.
                </p>
                <Link href="/subscription" className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-sm shadow-indigo-600/20">
                    Upgrade Plan
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <FileText className="h-8 w-8 text-indigo-600" />
                        Customer Notes
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Private notes for follow-ups and relationship management.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-200 space-y-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search chatted customers..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="overflow-y-auto max-h-[600px]">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                                </div>
                            ) : filteredConversations.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 px-6">
                                    <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                    <p className="font-medium">No customer chats found</p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Notes appear here after a customer starts a conversation with your business.
                                    </p>
                                </div>
                            ) : (
                                filteredConversations.map((conversation) => {
                                    const isSelected = selectedConversation?.id === conversation.id;
                                    const customerName =
                                        conversation.user?.fullName ||
                                        conversation.user?.email ||
                                        'Anonymous customer';
                                    const customerAvatar = getImageUrl(conversation.user?.avatarUrl || undefined);

                                    return (
                                        <div
                                            key={conversation.id}
                                            onClick={() => setSelectedConversation(conversation)}
                                            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-indigo-50 transition-colors ${
                                                isSelected ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                                                    {customerAvatar ? (
                                                        <img src={customerAvatar} alt={customerName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="h-4 w-4 text-indigo-600" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-medium text-gray-900 truncate">{customerName}</p>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {conversation.business?.title || 'Business conversation'}
                                                    </p>
                                                    {conversation.lastMessage && (
                                                        <p className="text-xs text-gray-400 truncate mt-1">{conversation.lastMessage}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {selectedConversation ? (
                            <>
                                <div className="p-4 border-b border-gray-200 bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-full bg-indigo-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                                            {selectedCustomerAvatar ? (
                                                <img src={selectedCustomerAvatar} alt={selectedCustomerName} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="h-5 w-5 text-indigo-600" />
                                            )}
                                        </div>
                                        <div>
                                            <h2 className="font-semibold text-gray-900">{selectedCustomerName}</h2>
                                            <p className="text-sm text-gray-500">
                                                {selectedConversation.user?.email || 'Customer conversation'}
                                                {selectedConversation.business?.title ? ` - Re: ${selectedConversation.business.title}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 border-b border-gray-200 max-h-[400px] overflow-y-auto">
                                    {notesLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                                        </div>
                                    ) : notes.length === 0 ? (
                                        <div className="text-center py-8 text-gray-400">
                                            <MessageSquare className="h-10 w-10 mx-auto mb-2" />
                                            <p>No private notes yet. Add the first follow-up note below.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {notes.map((note) => (
                                                <div key={note.id} className="bg-indigo-50 rounded-lg p-3">
                                                    <p className="text-sm text-gray-800">{note.content}</p>
                                                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                                        <Clock className="h-3 w-3" />
                                                        <span>{new Date(note.createdAt).toLocaleString()}</span>
                                                        <span>- by {note.createdByUser?.fullName || note.createdByUser?.email || 'Business Team'}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="p-4">
                                    <form
                                        className="flex gap-2"
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            handleAddNote();
                                        }}
                                    >
                                        <input
                                            type="text"
                                            placeholder="Add a private follow-up note..."
                                            value={newNote}
                                            onChange={(e) => setNewNote(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddNote();
                                                }
                                            }}
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                        <button
                                            type="submit"
                                            disabled={addingNote || !newNote.trim()}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {addingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                        </button>
                                    </form>
                                    {notesError && (
                                        <p className="mt-3 text-sm font-medium text-red-600">{notesError}</p>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400">
                                <FileText className="h-16 w-16 mb-4" />
                                <p className="text-lg font-medium">Select a customer chat</p>
                                <p className="text-sm">Choose a conversation to view and manage private notes</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
