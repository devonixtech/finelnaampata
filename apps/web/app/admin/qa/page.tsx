"use client";

import React, { useState, useEffect } from 'react';
import { 
    MessageSquare, 
    Check, 
    X, 
    Clock, 
    User, 
    Store,
    ShieldCheck,
    AlertCircle,
    ArrowLeft
} from 'lucide-react';
import { api } from '../../../lib/api';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from "react-hot-toast";

export default function AdminQAModeration() {
    const [pendingData, setPendingData] = useState<{ questions: any[], answers: any[] }>({ questions: [], answers: [] });
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const data = await api.qa.getPending();
            setPendingData(data);
        } catch (err) {
            console.error('Failed to fetch pending Q&A:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleModerate = async (id: string, type: 'question' | 'answer', status: 'approved' | 'rejected') => {
        const action = status === 'approved' ? 'approve' : 'reject';
        if (!confirm(`Are you sure you want to ${action} this ${type}?`)) return;

        setActionId(id);
        try {
            if (type === 'question') {
                await api.qa.moderateQuestion(id, { status });
            } else {
                await api.qa.moderateAnswer(id, { status });
            }
            await fetchData();
        } catch (err) {
            console.error(`Failed to moderate ${type}:`, err);
            toast.error(`Failed to ${action} ${type}. Please try again.`);
        } finally {
            setActionId(null);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Loading Moderation Queue...</p>
            </div>
        </div>
    );

    const totalPending = pendingData.questions.length + pendingData.answers.length;

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            {/* Header */}
            <div className="flex items-center justify-between mb-12">
                <div className="space-y-1">
                    <Link href="/admin" className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest mb-4">
                        <ArrowLeft className="w-3 h-3" /> Back to Dashboard
                    </Link>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Q&A Moderation</h1>
                    <p className="text-slate-500 font-bold">Review and approve questions and answers from the community.</p>
                </div>
                <div className="px-6 py-3 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest leading-none mb-1">Pending Items</p>
                        <p className="text-2xl font-black text-red-600 leading-none">{totalPending}</p>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
                {/* Questions Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black text-slate-900 border-b-4 border-blue-600 pb-2">Pending Questions</h2>
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-black">{pendingData.questions.length}</span>
                    </div>

                    {pendingData.questions.length > 0 ? (
                        <div className="space-y-4">
                            {pendingData.questions.map((q) => (
                                <motion.div 
                                    layout
                                    key={q.id} 
                                    className="p-6 bg-white border border-slate-100 rounded-[24px] shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all group"
                                >
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-900">{q.user?.fullName || 'Anonymous'}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(q.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                            <Store className="w-3 h-3" /> {q.business?.title || 'Business'}
                                        </div>
                                    </div>
                                    <p className="text-lg font-bold text-slate-800 leading-tight mb-6">
                                        "{q.content}"
                                    </p>
                                    <div className="flex items-center gap-3 border-t border-slate-50 pt-4">
                                        <button
                                            onClick={() => handleModerate(q.id, 'question', 'approved')}
                                            disabled={!!actionId}
                                            className="flex-grow flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            <Check className="w-4 h-4" /> Approve
                                        </button>
                                        <button
                                            onClick={() => handleModerate(q.id, 'question', 'rejected')}
                                            disabled={!!actionId}
                                            className="px-6 py-3 bg-red-50 text-red-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-100 transition-all active:scale-95"
                                        >
                                            <X className="w-4 h-4" /> Reject
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 bg-slate-50 rounded-[32px] border border-dashed border-slate-200 text-center">
                            <Check className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">All caught up!</p>
                            <p className="text-slate-300 text-xs mt-1">No pending questions to review.</p>
                        </div>
                    )}
                </div>

                {/* Answers Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black text-slate-900 border-b-4 border-violet-600 pb-2">Pending Answers</h2>
                        <span className="px-3 py-1 bg-violet-50 text-violet-600 rounded-full text-xs font-black">{pendingData.answers.length}</span>
                    </div>

                    {pendingData.answers.length > 0 ? (
                        <div className="space-y-4">
                            {pendingData.answers.map((a) => (
                                <motion.div 
                                    layout
                                    key={a.id} 
                                    className="p-6 bg-white border border-slate-100 rounded-[24px] shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all group"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center text-violet-400">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs font-black text-slate-900">{a.user?.fullName || 'Anonymous'}</p>
                                                    {a.isOfficial && (
                                                        <span className="px-2 py-0.5 bg-blue-600 text-white rounded-md text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                                                            <ShieldCheck className="w-3 h-3" /> Official
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(a.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mb-4 bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Replying to Question:</p>
                                        <p className="text-xs font-bold text-slate-600 italic">"{a.question?.content}"</p>
                                    </div>

                                    <p className="text-lg font-bold text-slate-800 leading-tight mb-6 bg-violet-50/30 p-4 rounded-2xl border border-violet-100/50">
                                        "{a.content}"
                                    </p>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleModerate(a.id, 'answer', 'approved')}
                                            disabled={!!actionId}
                                            className="flex-grow flex items-center justify-center gap-2 py-3 bg-violet-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-violet-700 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-violet-500/20"
                                        >
                                            <Check className="w-4 h-4" /> Approve Answer
                                        </button>
                                        <button
                                            onClick={() => handleModerate(a.id, 'answer', 'rejected')}
                                            disabled={!!actionId}
                                            className="px-6 py-3 bg-red-50 text-red-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-100 transition-all active:scale-95"
                                        >
                                            <X className="w-4 h-4" /> Reject
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 bg-slate-50 rounded-[32px] border border-dashed border-slate-200 text-center">
                            <Check className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Queue Empty</p>
                            <p className="text-slate-300 text-xs mt-1">No pending answers to moderate.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
