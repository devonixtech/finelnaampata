"use client";

import React, { useEffect, useState, useMemo } from 'react';
import {
    Star, Calendar, Building2, User as UserIcon, MessageCircle, Quote,
    ChevronLeft, ChevronRight, Send, X, MessageSquareQuote, Search,
    Filter, RefreshCw, TrendingUp
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { api, getImageUrl } from '../../../lib/api';
import { Review } from '../../../types/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FeatureGate } from '../../../components/vendor/FeatureGate';
import { usePlanFeature } from '../../../hooks/usePlanFeature';
import Link from 'next/link';
import { Lock } from 'lucide-react';

// ─── helpers ──────────────────────────────────────────────────────────────────
const formatDate = (d: string) => {
    try { return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(new Date(d)); }
    catch { return d; }
};

function StarRow({ rating, max = 5 }: { rating: number; max?: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: max }, (_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
            ))}
        </div>
    );
}

// ─── Rating distribution bar ──────────────────────────────────────────────────
function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
        <div className="flex items-center gap-3">
            <span className="text-xs font-black text-slate-500 w-3">{star}</span>
            <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    className="h-full bg-amber-400 rounded-full"
                />
            </div>
            <span className="text-xs font-bold text-slate-400 w-6 text-right">{count}</span>
        </div>
    );
}

// ─── Review Card ───────────────────────────────────────────────────────────────
function ReviewCard({ review, isVendor, canReply, onReply }: { review: Review; isVendor: boolean; canReply: boolean; onReply: (r: Review) => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-[20px] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col"
        >
            {/* Business */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100">
                    {(review as any).business?.coverImageUrl ? (
                        <img src={getImageUrl((review as any).business.coverImageUrl) as string}
                            alt={(review as any).business?.title || ''}
                            className="w-full h-full object-cover" />
                    ) : <Building2 className="w-5 h-5 text-slate-300 m-auto mt-2.5" />}
                </div>
                <div className="min-w-0">
                    <p className="font-black text-slate-900 text-sm truncate">{(review as any).business?.title || (review as any).business?.name || 'Listing'}</p>
                    <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                        <Calendar className="w-2.5 h-2.5" /> {formatDate(review.createdAt)}
                    </div>
                </div>
            </div>

            {/* Stars */}
            <div className="mb-3"><StarRow rating={review.rating} /></div>

            {/* Comment */}
            <div className="flex-1 mb-4">
                <p className="text-slate-600 text-sm leading-relaxed italic line-clamp-4">"{review.comment}"</p>
            </div>

            {/* Reviewer + reply */}
            <div className="pt-4 border-t border-slate-50">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0">
                            <UserIcon className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-xs font-black text-slate-900 uppercase tracking-widest">
                            {review.user?.fullName || 'Customer'}
                        </span>
                    </div>
                    {isVendor && !review.vendorResponse && (
                        canReply ? (
                            <button onClick={() => onReply(review)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-[10px] font-black rounded-xl hover:bg-blue-700 transition-all">
                                <Send className="w-3 h-3" /> Reply
                            </button>
                        ) : (
                            <Link href="/subscription"
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 text-[10px] font-black rounded-xl border border-orange-100 hover:bg-orange-100 transition-all">
                                <Lock className="w-3 h-3" /> Upgrade to Reply
                            </Link>
                        )
                    )}
                </div>

                {review.vendorResponse && (
                    <div className="mt-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                        <div className="flex items-center gap-1.5 mb-1">
                            <MessageCircle className="w-3 h-3 text-blue-600" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-blue-600">Official Reply</span>
                        </div>
                        <p className="text-slate-500 text-xs leading-relaxed italic line-clamp-2">{review.vendorResponse}</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const ITEMS_PER_PAGE = 9;

export default function BusinessReviews() {
    const { user } = useAuth();
    const { hasFeature } = usePlanFeature();
    const canReplyReviews = hasFeature('canReplyReviews');
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    // Filters
    const [search, setSearch] = useState('');
    const [ratingFilter, setRatingFilter] = useState<number | ''>('');
    const [listingFilter, setListingFilter] = useState('');

    // Reply modal
    const [respondingTo, setRespondingTo] = useState<Review | null>(null);
    const [responseText, setResponseText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isVendor = user?.role === 'vendor' || user?.role === 'admin' || user?.role === 'superadmin';

    const fetchReviews = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Use standardized reviews API
            const res = await api.reviews.getVendorAll(1, 100);
            setReviews(res.data || []);
        } catch (e) {
            console.error('Failed to fetch reviews:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReviews(); }, [user]);

    // Derived stats
    const stats = useMemo(() => {
        const total = reviews.length;
        const sum = reviews.reduce((a, r) => a + r.rating, 0);
        const avg = total > 0 ? Math.round((sum / total) * 10) / 10 : 0;
        const distribution = [5, 4, 3, 2, 1].map(s => ({ star: s, count: reviews.filter(r => r.rating === s).length }));
        const unanswered = reviews.filter(r => !r.vendorResponse).length;
        return { total, avg, distribution, unanswered };
    }, [reviews]);

    // Unique listings for filter dropdown
    const listings = useMemo(() => {
        const map = new Map<string, string>();
        reviews.forEach(r => {
            const b = (r as any).business;
            if (b?.id) map.set(b.id, b.title || b.name || b.id);
        });
        return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
    }, [reviews]);

    // Filtered + paginated
    const filtered = useMemo(() => {
        return reviews.filter(r => {
            if (ratingFilter !== '' && r.rating !== ratingFilter) return false;
            if (listingFilter && (r as any).business?.id !== listingFilter) return false;
            if (search) {
                const q = search.toLowerCase();
                const name = (r.user?.fullName || '').toLowerCase();
                const comment = (r.comment || '').toLowerCase();
                if (!name.includes(q) && !comment.includes(q)) return false;
            }
            return true;
        });
    }, [reviews, ratingFilter, listingFilter, search]);

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handleReply = async () => {
        if (!respondingTo || !responseText.trim()) return;
        if (!canReplyReviews) {
            alert('Replying to reviews requires a paid plan. Upgrade to respond.');
            return;
        }
        setIsSubmitting(true);
        try {
            // Use standardized reviews API for vendor response
            await api.reviews.respond(respondingTo.id, responseText.trim());
            setRespondingTo(null);
            setResponseText('');
            await fetchReviews();
        } catch (error: any) {
            console.error('Reply failed:', error);
            alert(error.message || 'Failed to submit. Try again.');
        }
        finally { setIsSubmitting(false); }
    };

    if (loading && reviews.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="relative w-16 h-16">
                    <div className="w-16 h-16 border-4 border-amber-400/20 rounded-full" />
                    <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
                </div>
            </div>
        );
    }

    return (
        <FeatureGate feature="showReviews" title="Customer Reviews" description="Monitor and respond to customer feedback across all your business listings. Build trust and reputation with expert responses.">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-32">

                {/* ── Header ─────────────────────────────────────────── */}
                <div className="relative overflow-hidden bg-slate-900 rounded-[20px] p-8 sm:p-10 mb-8 shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 blur-[100px] rounded-full -mr-32 -mt-32" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-600/15 blur-[80px] rounded-full -ml-24 -mb-24" />

                    <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tight mb-2">Business Reputation</h1>
                            <p className="text-slate-400 font-bold">All customer reviews across your listings</p>
                        </div>

                        {/* Stats pills */}
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-4 text-center">
                                <div className="text-4xl font-black text-white tabular-nums">{stats.avg || '—'}</div>
                                <StarRow rating={Math.round(stats.avg)} />
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Avg Rating</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-4 text-center">
                                <div className="text-4xl font-black text-white tabular-nums">{stats.total}</div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Total Reviews</div>
                            </div>
                            {isVendor && (
                                <div className="bg-amber-500/20 border border-amber-400/20 rounded-2xl px-6 py-4 text-center">
                                    <div className="text-4xl font-black text-amber-400 tabular-nums">{stats.unanswered}</div>
                                    <div className="text-[10px] font-black text-amber-400/70 uppercase tracking-widest mt-1">Unanswered</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Rating distribution */}
                    {stats.total > 0 && (
                        <div className="relative z-10 mt-8 bg-white/5 rounded-2xl p-5 border border-white/10 space-y-2">
                            {stats.distribution.map(({ star, count }) => (
                                <RatingBar key={star} star={star} count={count} total={stats.total} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Review broadcast requirements (client spec) */}
                <div className="mb-6 rounded-2xl border border-violet-100 bg-violet-50/70 p-5">
                    <h2 className="text-sm font-black text-slate-900 mb-3">Review Broadcast Requirements</h2>
                    <div className="grid gap-2 text-xs font-semibold text-slate-600 sm:grid-cols-2">
                        <p>Share a real customer requirement with a clear scope, category, city, and expected timeline.</p>
                        <p>Do not request fake reviews, paid positive reviews, competitor reviews, or duplicate/spam broadcasts.</p>
                        <p>Include enough details for businesses to decide whether they can help before responding.</p>
                        <p>A business cannot broadcast in a category where it already has an active listing.</p>
                    </div>
                    <p className="mt-3 text-[10px] font-bold text-violet-700">
                        Post review-request broadcasts from{' '}
                        <a href="/broadcasts" className="underline">Broadcast Feed</a>.
                    </p>
                </div>

                {/* Review Guidelines Panel */}
                <div className="mb-8 rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
                    <h2 className="text-sm font-black text-slate-900 mb-3">Responding to Customer Reviews</h2>
                    <div className="grid gap-2 text-xs font-semibold text-slate-600 sm:grid-cols-2">
                        <p>Keep responses professional, courteous, and constructive, regardless of the reviewer's tone.</p>
                        <p>Do not post personally identifiable information (PII) about the customer.</p>
                        <p>Address concerns transparently and offer a resolution when applicable.</p>
                        <p>Avoid using copied-and-pasted generic templates for every response.</p>
                    </div>
                </div>

                {/* ── Filters ────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <div className="relative border border-slate-100 rounded-xl overflow-hidden flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            id="review-search"
                            type="text"
                            placeholder="Search by reviewer name or comment…"
                            value={search}
                            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-10 pr-4 py-2.5 text-sm font-medium bg-slate-50 border-none focus:bg-white outline-none transition-all"
                        />
                    </div>

                    {/* Rating filter */}
                    <div className="relative border border-slate-100 rounded-xl overflow-hidden">
                        <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <select
                            id="review-rating-filter"
                            value={ratingFilter}
                            onChange={e => { setRatingFilter(e.target.value === '' ? '' : Number(e.target.value)); setCurrentPage(1); }}
                            className="pl-9 pr-8 py-2.5 text-sm font-bold bg-slate-50 border-none outline-none appearance-none cursor-pointer"
                        >
                            <option value="">All Ratings</option>
                            {[5, 4, 3, 2, 1].map(s => <option key={s} value={s}>{s} Stars</option>)}
                        </select>
                    </div>

                    {/* Listing filter */}
                    {listings.length > 1 && (
                        <div className="relative border border-slate-100 rounded-xl overflow-hidden">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            <select
                                id="review-listing-filter"
                                value={listingFilter}
                                onChange={e => { setListingFilter(e.target.value); setCurrentPage(1); }}
                                className="pl-9 pr-8 py-2.5 text-sm font-bold bg-slate-50 border-none outline-none appearance-none cursor-pointer max-w-[200px] truncate"
                            >
                                <option value="">All Listings</option>
                                {listings.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                            </select>
                        </div>
                    )}

                    {/* Refresh */}
                    <button onClick={fetchReviews} disabled={loading}
                        className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-all">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Result count */}
                {(search || ratingFilter !== '' || listingFilter) && (
                    <p className="text-xs font-bold text-slate-400 mb-4">
                        Showing {filtered.length} of {stats.total} reviews
                        {ratingFilter !== '' && ` · ${ratingFilter}★ only`}
                        {listingFilter && ` · ${listings.find(l => l.id === listingFilter)?.title}`}
                    </p>
                )}

                {/* ── Reviews Grid ────────────────────────────────────── */}
                {filtered.length === 0 && !loading ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl flex items-center justify-center">
                            <Star className="w-10 h-10 text-amber-300" />
                        </div>
                        <div className="text-center">
                            <p className="text-slate-700 font-black text-lg">
                                {stats.total === 0
                                    ? 'No reviews yet'
                                    : 'No reviews match your filters'}
                            </p>
                            <p className="text-slate-400 text-sm mt-1">
                                {stats.total === 0
                                    ? 'Encourage your customers to leave a review on your listings!'
                                    : 'Try adjusting your search or filters.'}
                            </p>
                            {(search || ratingFilter !== '' || listingFilter) && (
                                <button onClick={() => { setSearch(''); setRatingFilter(''); setListingFilter(''); }}
                                    className="mt-4 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all">
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence mode="popLayout">
                            {paginated.map((review, idx) => (
                                <ReviewCard
                                    key={review.id}
                                    review={review}
                                    isVendor={isVendor}
                                    canReply={canReplyReviews}
                                    onReply={setRespondingTo}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {/* ── Pagination ─────────────────────────────────────── */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-12">
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
                            className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:border-slate-300 disabled:opacity-30 transition-all">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                                <button key={n} onClick={() => setCurrentPage(n)}
                                    className={`w-10 h-10 rounded-xl font-black text-sm border transition-all ${currentPage === n ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-400'}`}>
                                    {n}
                                </button>
                            ))}
                        </div>
                        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}
                            className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:border-slate-300 disabled:opacity-30 transition-all">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* ── Reply Modal ────────────────────────────────────── */}
                <AnimatePresence>
                    {respondingTo && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setRespondingTo(null)}
                                className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-white rounded-[20px] w-full max-w-xl p-8 shadow-2xl relative z-10 border border-slate-100"
                            >
                                <button onClick={() => setRespondingTo(null)}
                                    className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-full transition-colors">
                                    <X className="w-6 h-6 text-slate-400" />
                                </button>

                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                                        <MessageSquareQuote className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900">Post Response</h2>
                                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-0.5">
                                            Replying to {respondingTo.user?.fullName}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-slate-50 rounded-2xl p-5 mb-6 border border-slate-100">
                                    <div className="flex items-center gap-1 mb-2">
                                        <StarRow rating={respondingTo.rating} />
                                    </div>
                                    <p className="text-slate-500 font-bold italic text-sm">"{respondingTo.comment}"</p>
                                </div>

                                <textarea
                                    value={responseText}
                                    onChange={e => setResponseText(e.target.value)}
                                    placeholder="Type your professional response here..."
                                    className="w-full h-36 bg-white border border-slate-200 rounded-2xl p-5 text-slate-700 font-bold focus:outline-none focus:ring-4 focus:ring-blue-600/10 transition-all resize-none"
                                />

                                <div className="flex gap-3 mt-6">
                                    <button onClick={() => setRespondingTo(null)}
                                        className="flex-1 py-3.5 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition-all">
                                        Cancel
                                    </button>
                                    <button
                                        disabled={isSubmitting || !responseText.trim()}
                                        onClick={handleReply}
                                        className="flex-[2] py-3.5 bg-blue-600 text-white font-black rounded-2xl shadow-lg hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting
                                            ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            : <><Send className="w-4 h-4" /> Submit Response</>
                                        }
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </FeatureGate>
    );
}
