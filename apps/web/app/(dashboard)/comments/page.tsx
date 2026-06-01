"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare, Pencil, Trash2, X, CheckCircle2,
    Loader2, Star, Calendar, Clock, Store,
    AlertTriangle, ChevronLeft, ChevronRight, Send,
    User as UserIcon, MessageCircle, Lock
} from 'lucide-react';
import { api } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { FeatureGate } from '../../../components/vendor/FeatureGate';
import Link from 'next/link';

interface CommentItem {
    id: string;
    content: string;
    rating?: number;
    status: string;
    createdAt: string;
    user?: { id: string; fullName: string; avatarUrl?: string };
    business?: { id: string; title: string };
    reply?: { id: string; replyText: string; createdAt: string };
}

const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all placeholder:text-slate-400";
const labelClass = "block text-xs font-black uppercase tracking-widest text-slate-400 mb-2";

export default function BusinessCommentsPage() {
    const { user } = useAuth();
    const [comments, setComments] = useState<CommentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [replying, setReplying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showReplyModal, setShowReplyModal] = useState(false);
    const [activeComment, setActiveComment] = useState<CommentItem | null>(null);
    const [replyText, setReplyText] = useState('');
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState<any>(null);
    const [deleteReplyId, setDeleteReplyId] = useState<string | null>(null);

    const activeSub = user?.vendor?.subscriptions?.find((sub: any) => sub.status === 'active');
    const features = activeSub?.plan?.dashboardFeatures || {};
    const isVendor = user?.role === 'vendor';

    const loadComments = async (p = 1) => {
        setLoading(true);
        try {
            const res = await api.comments.getVendorComments(p, 10);
            setComments(res.data);
            setMeta(res.meta);
        } catch (err: any) {
            setError(err.message || 'Failed to load comments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadComments(1);
    }, [user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            </div>
        );
    }

    // Businesses always have access to managing their customer reviews.
    // The previous lock screen has been removed to provide full feature access.
    
    const openReply = (comment: CommentItem) => {
        setActiveComment(comment);
        setReplyText(comment.reply?.replyText || '');
        setShowReplyModal(true);
        setError(null);
    };

    const handleReplySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeComment) return;
        setReplying(true);
        setError(null);
        try {
            if (activeComment.reply) {
                await api.comments.updateReply(activeComment.reply.id, { replyText });
                setSuccess('Reply updated successfully!');
            } else {
                await api.comments.reply(activeComment.id, { replyText });
                setSuccess('Reply sent successfully!');
            }
            setShowReplyModal(false);
            await loadComments(page);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to send reply');
        } finally {
            setReplying(false);
        }
    };

    const handleDeleteReply = async () => {
        if (!deleteReplyId) return;
        setLoading(true);
        try {
            await api.comments.deleteReply(deleteReplyId);
            setDeleteReplyId(null);
            setSuccess('Reply removed.');
            await loadComments(page);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to delete reply');
        } finally {
            setLoading(false);
        }
    };

    const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <FeatureGate feature="showReviews" title="Manage Customer Feedback" description="View and respond to customer reviews for all your business listings. Build trust and improve your reputation today.">
            <div className="max-w-6xl mx-auto pb-16">
            {/* Header */}
            <div className="relative mb-8 rounded-[20px] overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155] p-10 shadow-2xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md">
                            <MessageCircle className="w-8 h-8 text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tight">Customer Comments</h1>
                            <p className="text-white/60 text-base font-medium mt-1">Manage feedback and maintain customer relationships</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alerts */}
            <AnimatePresence>
                {success && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-700 font-bold flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />{success}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Comments Table */}
            <div className="bg-white rounded-[20px] border border-slate-100  shadow-slate-200/50 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="font-black text-slate-900 text-lg">Recent Feedbacks</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Interaction History</p>
                    </div>
                    {meta && (
                        <span className="text-xs font-black text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100">
                            {meta.total} COMMENTS
                        </span>
                    )}
                </div>

                {loading && !comments.length ? (
                    <div className="flex items-center justify-center py-32">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-6 text-slate-400">
                        <div className="w-24 h-24 rounded-[28px] bg-slate-50 flex items-center justify-center border border-slate-100">
                            <MessageSquare className="w-12 h-12 text-slate-200" />
                        </div>
                        <div className="text-center">
                            <p className="font-black text-slate-700 text-xl">No comments yet</p>
                            <p className="text-sm mt-1 max-w-xs mx-auto leading-relaxed">When customers review your business, they will appear here for you to respond.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        {['Business / User', 'Comment', 'Rating', 'Date', 'Status', 'Actions'].map(h => (
                                            <th key={h} className="px-8 py-4 text-left text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {comments.map(comment => (
                                        <tr key={comment.id} className="hover:bg-blue-50/30 transition-all duration-300">
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col gap-3">
                                                    <div className="flex items-center gap-2 text-slate-900">
                                                        <Store className="w-4 h-4 text-slate-400" />
                                                        <span className="text-sm font-black">{comment.business?.title}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-2xl bg-slate-100 overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                                                            <img
                                                                src={comment.user?.avatarUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                                                alt="" className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-500">{comment.user?.fullName}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 max-w-xs">
                                                <p className="text-sm text-slate-600 font-medium leading-relaxed italic">"{comment.content}"</p>
                                                {comment.reply && (
                                                    <div className="mt-3 p-3 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Your Reply</span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 line-clamp-2">{comment.reply.replyText}</p>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-8 py-6">
                                                {comment.rating ? (
                                                    <div className="flex gap-0.5">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} className={`w-3.5 h-3.5 ${i < (comment.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                                                        ))}
                                                    </div>
                                                ) : <span className="text-slate-300 text-xs font-bold uppercase tracking-widest">No Rating</span>}
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {fmtDate(comment.createdAt)}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${comment.reply
                                                    ? 'bg-green-50 text-green-600 border border-green-100'
                                                    : 'bg-amber-50 text-amber-600 border border-amber-100'
                                                    }`}>
                                                    <div className={`w-1 h-1 rounded-full ${comment.reply ? 'bg-green-600' : 'bg-amber-600'}`} />
                                                    {comment.reply ? 'Replied' : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center gap-2 justify-end">
                                                    {!comment.reply ? (
                                                        <button
                                                            onClick={() => openReply(comment)}
                                                            className="px-4 py-2 bg-slate-900 text-white text-[11px] font-black rounded-xl hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-slate-900/10"
                                                        >
                                                            <Send className="w-3 h-3" /> REPLY
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button onClick={() => openReply(comment)}
                                                                className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-all border border-blue-100/50">
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button onClick={() => setDeleteReplyId(comment.reply!.id)}
                                                                className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-all border border-rose-100/50">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {meta && meta.totalPages > 1 && (
                            <div className="px-8 py-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
                                <p className="text-xs text-slate-400 font-black uppercase tracking-widest">
                                    Page {meta.page} of {meta.totalPages}
                                </p>
                                <div className="flex gap-3">
                                    <button disabled={meta.page <= 1}
                                        onClick={() => { const p = page - 1; setPage(p); loadComments(p); }}
                                        className="w-10 h-10 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-white hover:border-blue-400 hover:text-blue-500 disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-slate-500 transition-all font-black">
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button disabled={meta.page >= meta.totalPages}
                                        onClick={() => { const p = page + 1; setPage(p); loadComments(p); }}
                                        className="w-10 h-10 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-white hover:border-blue-400 hover:text-blue-500 disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-slate-500 transition-all font-black">
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Reply Modal */}
            <AnimatePresence>
                {showReplyModal && activeComment && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4"
                        onClick={() => setShowReplyModal(false)}>
                        <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-[28px] shadow-2xl w-full max-w-xl overflow-hidden">

                            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                                        <Send className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 leading-tight">
                                            {activeComment.reply ? 'Edit Your Reply' : 'Reply to Customer'}
                                        </h3>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Direct Response</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowReplyModal(false)}
                                    className="w-10 h-10 rounded-2xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            <form onSubmit={handleReplySubmit} className="p-8 space-y-6">
                                {/* Customer Quote */}
                                <div className="p-6 bg-slate-50 rounded-[20px] border border-slate-100 relative">
                                    <div className="absolute -top-3 left-6 px-3 py-1 bg-white border border-slate-100 rounded-lg shadow-sm">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Customer Said</span>
                                    </div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <UserIcon className="w-4 h-4 text-slate-300" />
                                        <span className="text-sm font-black text-slate-900">{activeComment.user?.fullName}</span>
                                    </div>
                                    <p className="text-sm text-slate-500 italic leading-relaxed">"{activeComment.content}"</p>
                                </div>

                                <div>
                                    <label className={labelClass}>Your Response *</label>
                                    <textarea
                                        required
                                        rows={6}
                                        value={replyText}
                                        onChange={e => setReplyText(e.target.value)}
                                        placeholder="Write a professional response to your customer..."
                                        className={`${inputClass} resize-none leading-relaxed p-6`}
                                    />
                                    <p className="mt-3 text-[10px] text-slate-400 italic">This reply will be publicly visible on your business page.</p>
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <button type="button" onClick={() => setShowReplyModal(false)}
                                        className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all">
                                        CANCEL
                                    </button>
                                    <button type="submit" disabled={replying || !replyText.trim()}
                                        className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black text-sm  shadow-slate-900/10 hover:bg-blue-600 transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                                        {replying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                        {activeComment.reply ? 'UPDATE RESPONSE' : 'SEND RESPONSE'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Reply Confirmation */}
            <AnimatePresence>
                {deleteReplyId && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            className="bg-white rounded-[28px] shadow-2xl w-full max-w-sm p-10 text-center">
                            <div className="w-20 h-20 bg-rose-50 rounded-[20px] flex items-center justify-center mx-auto mb-6">
                                <Trash2 className="w-10 h-10 text-rose-500" />
                            </div>
                            <h3 className="font-black text-slate-900 text-2xl mb-2">Remove Reply?</h3>
                            <p className="text-slate-500 text-sm mb-8 leading-relaxed font-medium">This will permanently delete your response to this customer. You can always write a new one later.</p>
                            <div className="flex gap-4">
                                <button onClick={() => setDeleteReplyId(null)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all">
                                    CANCEL
                                </button>
                                <button onClick={handleDeleteReply}
                                    className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black text-sm hover:bg-rose-600 transition-all  shadow-rose-500/20">
                                    DELETE
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            </div>
        </FeatureGate>
    );
}
