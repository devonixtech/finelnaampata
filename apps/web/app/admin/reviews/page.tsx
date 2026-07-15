"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import {
    ShieldAlert,
    CheckCircle,
    Trash2,
    Search,
    Clock,
    User as UserIcon,
    Store,
    AlertTriangle,
    MessageSquare,
    RefreshCcw,
    ChevronLeft,
    ChevronRight,
    Star,
    X,
    Eye,
    ShieldOff,
    Globe,
    ThumbsUp,
    ChevronDown,
    Ban,
    BadgeCheck,
    MoreVertical,
    ExternalLink,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Review {
    id: string;
    title?: string;
    comment: string;
    rating: number;
    isApproved: boolean;
    isSuspicious: boolean;
    suspicionScore: number;
    suspicionReason?: string;
    ipAddress?: string;
    helpfulCount: number;
    createdAt: string;
    user?: { fullName: string; email?: string };
    business?: { 
        name: string; 
        slug?: string;
        vendor?: {
            user?: {
                fullName: string;
            };
            businessName?: string;
        };
    };
    vendorResponse?: string;
}

// ─── Star Rating ─────────────────────────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className={`w-3.5 h-3.5 ${i <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-100'}`} />
            ))}
        </div>
    );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, textColor, border }: {
    label: string; value: number | string; icon: any; color: string; textColor: string; border: string;
}) {
    return (
        <div className={`bg-white rounded-2xl border ${border} p-5 flex items-center gap-4 shadow-sm`}>
            <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${textColor}`} />
            </div>
            <div>
                <p className="text-2xl font-black text-slate-900 leading-none">{value}</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{label}</p>
            </div>
        </div>
    );
}

// ─── Kebab Menu ──────────────────────────────────────────────────────────────
function KebabMenu({ review, onModerate, onDelete }: {
    review: Review;
    onModerate: (id: string, action: any) => void;
    onDelete: (id: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const btnRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const isActing = false;

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (
                menuRef.current && !menuRef.current.contains(e.target as Node) &&
                btnRef.current && !btnRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open]);

    const alreadyApproved = review.isApproved && !review.isSuspicious;
    const alreadyFlagged = review.isSuspicious && !review.isApproved;

    return (
        <div className="relative flex-shrink-0">
            {/* ⋮ Trigger */}
            <button
                ref={btnRef}
                onClick={() => setOpen(v => !v)}
                className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all duration-150 ${open
                        ? 'bg-slate-900 border-slate-900 text-white shadow-lg'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                title="Actions"
            >
                <MoreVertical className="w-4 h-4" />
            </button>

            {/* Dropdown */}
            {open && (
                <div
                    ref={menuRef}
                    className="absolute right-0 top-[calc(100%+6px)] w-52 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[9999] overflow-hidden"
                    style={{ boxShadow: '0 20px 60px -10px rgba(0,0,0,0.18)' }}
                >
                    {/* View Listing */}
                    {review.business?.slug ? (
                        <Link
                            href={`/business/${review.business.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                        >
                            <div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
                                <ExternalLink className="w-3.5 h-3.5 text-white" />
                            </div>
                            View Listing Page
                        </Link>
                    ) : (
                        <div className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-400 border-b border-slate-100 cursor-not-allowed">
                            <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Eye className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                            No Listing Slug
                        </div>
                    )}

                    {/* Approve */}
                    <button
                        disabled={alreadyApproved}
                        onClick={() => {
                            onModerate(review.id, { isApproved: true, isSuspicious: false });
                            setOpen(false);
                        }}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-50 transition-colors w-full text-left disabled:opacity-40 disabled:cursor-default"
                    >
                        <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        {alreadyApproved ? 'Already Approved' : 'Approve Review'}
                    </button>

                    {/* Flag */}
                    <button
                        disabled={alreadyFlagged}
                        onClick={() => {
                            onModerate(review.id, { isApproved: false, isSuspicious: true });
                            setOpen(false);
                        }}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-orange-700 hover:bg-orange-50 transition-colors w-full text-left disabled:opacity-40 disabled:cursor-default"
                    >
                        <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <ShieldOff className="w-3.5 h-3.5 text-orange-600" />
                        </div>
                        {alreadyFlagged ? 'Already Flagged' : 'Flag Suspicious'}
                    </button>

                    {/* Divider */}
                    <div className="h-px bg-slate-100 mx-3" />

                    {/* Delete */}
                    <button
                        onClick={() => {
                            setOpen(false);
                            setTimeout(() => {
                                if (confirm('Permanently delete this review? This cannot be undone.')) {
                                    onDelete(review.id);
                                }
                            }, 100);
                        }}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                    >
                        <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        </div>
                        Delete Review
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReviewModerationPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalReviews, setTotalReviews] = useState(0);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState({ isSuspicious: 'all', isApproved: 'all' });
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [stats, setStats] = useState({ total: 0, suspicious: 0, approved: 0, pending: 0 });
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const fetchReviews = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = { page, limit: 12 };
            if (filter.isSuspicious !== 'all') params.isSuspicious = filter.isSuspicious;
            if (filter.isApproved !== 'all') params.isApproved = filter.isApproved;

            const response = await api.reviews.adminGetAll(params);
            const data: Review[] = (response.data || []) as any[];
            setReviews(data);
            const total = response.meta?.total || 0;
            setTotalReviews(total);
            setTotalPages(Math.ceil(total / 12) || 1);

            if (filter.isSuspicious === 'all' && filter.isApproved === 'all') {
                const suspicious = data.filter(r => r.isSuspicious).length;
                const approved = data.filter(r => r.isApproved && !r.isSuspicious).length;
                const pending = data.filter(r => !r.isApproved).length;
                setStats({ total, suspicious, approved, pending });
            }
        } catch (err) {
            console.error('Failed to fetch reviews:', err);
        } finally {
            setLoading(false);
        }
    }, [page, filter]);

    useEffect(() => { fetchReviews(); }, [fetchReviews]);

    const handleModerate = async (id: string, action: any) => {
        setActionLoading(id);
        try {
            await api.reviews.adminModerate(id, action);
            setReviews(prev => prev.map(r => r.id === id ? { ...r, ...action } : r));
        } catch (err) {
            console.error('Moderation failed:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this review?')) return;
        
        setActionLoading(id);
        try {
            await api.reviews.adminDelete(id);
            setReviews(prev => prev.filter(r => r.id !== id));
            setTotalReviews(prev => prev - 1);
        } catch (err: any) {
            console.error('Delete failed:', err);
            alert(err.message || 'Failed to delete review');
        } finally {
            setActionLoading(null);
        }
    };

    const filteredReviews = reviews.filter(r => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            r.title?.toLowerCase().includes(q) ||
            r.comment?.toLowerCase().includes(q) ||
            r.user?.fullName?.toLowerCase().includes(q) ||
            r.business?.name?.toLowerCase().includes(q)
        );
    });

    const getRatingColor = (rating: number) => {
        if (rating >= 4) return 'bg-emerald-100 text-emerald-700';
        if (rating === 3) return 'bg-amber-100 text-amber-700';
        return 'bg-red-100 text-red-700';
    };

    return (
        <div className="space-y-7 pb-20">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                    {/* <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-100 rounded-full mb-3">
                        <ShieldAlert className="w-3 h-3 text-red-500" />
                        <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Super Admin</span>
                    </div> */}
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-1">
                        Review <span className="bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">Moderation</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-sm">Inspect, approve, flag, or remove reviews across all listings.</p>
                </div>
                <button
                    onClick={() => { setPage(1); fetchReviews(); }}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 shadow-sm disabled:opacity-50 self-start"
                >
                    <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Reviews" value={stats.total || totalReviews} icon={MessageSquare} color="bg-slate-100" textColor="text-slate-500" border="border-slate-100" />
                <StatCard label="Suspicious" value={stats.suspicious} icon={AlertTriangle} color="bg-orange-100" textColor="text-orange-500" border="border-orange-100" />
                <StatCard label="Approved" value={stats.approved} icon={BadgeCheck} color="bg-emerald-100" textColor="text-emerald-600" border="border-emerald-100" />
                <StatCard label="Blocked" value={stats.pending} icon={Ban} color="bg-red-100" textColor="text-red-500" border="border-red-100" />
            </div>

            {/* ── Filter Bar ── */}
            <div className="bg-white border border-slate-100 rounded-2xl p-3.5 shadow-sm flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative flex-grow min-w-[180px]">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search content, reviewer, business…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-200 rounded-md transition-colors">
                            <X className="w-3 h-3 text-slate-400" />
                        </button>
                    )}
                </div>

                <div className="relative w-40 min-w-[150px]">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                        <ShieldAlert className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="pl-6">
                        <SearchableSelect
                            value={filter.isSuspicious}
                            onChange={val => { setPage(1); setFilter(p => ({ ...p, isSuspicious: val })); }}
                            options={[
                                { label: "All Flags", value: "all" },
                                { label: "⚠ Suspicious", value: "true" },
                                { label: "✓ Clean", value: "false" }
                            ]}
                        />
                    </div>
                </div>

                <div className="relative w-44 min-w-[160px]">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                        <CheckCircle className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="pl-6">
                        <SearchableSelect
                            value={filter.isApproved}
                            onChange={val => { setPage(1); setFilter(p => ({ ...p, isApproved: val })); }}
                            options={[
                                { label: "Any Status", value: "all" },
                                { label: "✓ Approved", value: "true" },
                                { label: "✗ Unapproved", value: "false" }
                            ]}
                        />
                    </div>
                </div>

                {/* Clear filters */}
                {(filter.isSuspicious !== 'all' || filter.isApproved !== 'all') && (
                    <button
                        onClick={() => setFilter({ isSuspicious: 'all', isApproved: 'all' })}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-black hover:bg-red-100 transition-colors"
                    >
                        <X className="w-3 h-3" /> Clear
                    </button>
                )}

                <span className="ml-auto text-xs font-bold text-slate-400">{filteredReviews.length} of {totalReviews}</span>
            </div>

            {/* ── Review List ── */}
            <div className="space-y-3">
                {/* Skeleton */}
                {loading && reviews.length === 0 ? (
                    <div className="space-y-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
                                <div className="flex gap-4">
                                    <div className="flex-grow space-y-2.5">
                                        <div className="flex gap-3"><div className="h-3.5 w-24 bg-slate-100 rounded-full" /><div className="h-3.5 w-20 bg-slate-100 rounded-full" /></div>
                                        <div className="h-4 w-56 bg-slate-100 rounded-full" />
                                        <div className="h-3.5 w-full bg-slate-100 rounded-full" />
                                        <div className="h-3.5 w-4/5 bg-slate-100 rounded-full" />
                                    </div>
                                    <div className="w-9 h-9 bg-slate-100 rounded-xl flex-shrink-0" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredReviews.length === 0 ? (
                    /* Empty state */
                    <div className="bg-white rounded-2xl border border-slate-100 py-20 flex flex-col items-center justify-center text-center gap-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                            <MessageSquare className="w-8 h-8 text-slate-200" />
                        </div>
                        <div>
                            <p className="text-lg font-black text-slate-900">No reviews found</p>
                            <p className="text-slate-400 font-medium text-sm mt-1">Try adjusting your search or filter criteria.</p>
                        </div>
                        <button
                            onClick={() => { setSearch(''); setFilter({ isSuspicious: 'all', isApproved: 'all' }); }}
                            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-700 transition-colors"
                        >
                            Reset All Filters
                        </button>
                    </div>
                ) : (
                    filteredReviews.map(review => {
                        const isExpanded = expandedId === review.id;

                        return (
                            <div
                                key={review.id}
                                className={`bg-white rounded-2xl border transition-all duration-200 hover:shadow-md ${review.isSuspicious ? 'border-orange-200' : review.isApproved ? 'border-slate-100' : 'border-red-100'
                                    }`}
                            >
                                {/* Suspicious bar at top */}
                                {review.isSuspicious && review.suspicionScore > 0 && (
                                    <div className="h-1 bg-orange-100 rounded-t-2xl overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all"
                                            style={{ width: `${Math.round(review.suspicionScore * 100)}%` }}
                                        />
                                    </div>
                                )}

                                <div className="p-5">
                                    <div className="flex gap-4">
                                        {/* ── Content ── */}
                                        <div className="flex-grow min-w-0 space-y-2.5">
                                            {/* Row 1: stars + rating badge + status badges + date */}
                                            <div className="flex items-center flex-wrap gap-2">
                                                <StarRating rating={review.rating} />
                                                <span className={`px-2 py-0.5 rounded-lg text-xs font-black ${getRatingColor(review.rating)}`}>
                                                    {review.rating}/5
                                                </span>
                                                {review.isSuspicious && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 border border-orange-200 rounded-full text-[10px] font-black uppercase tracking-wide">
                                                        <AlertTriangle className="w-2.5 h-2.5" />
                                                        Suspicious · {Math.round((review.suspicionScore || 0) * 100)}%
                                                    </span>
                                                )}
                                                {!review.isApproved && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 border border-red-200 rounded-full text-[10px] font-black uppercase tracking-wide">
                                                        <Ban className="w-2.5 h-2.5" /> Blocked
                                                    </span>
                                                )}
                                                {review.isApproved && !review.isSuspicious && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-wide">
                                                        <CheckCircle className="w-2.5 h-2.5" /> Approved
                                                    </span>
                                                )}
                                                <span className="ml-auto text-[11px] text-slate-400 font-medium flex items-center gap-1 flex-shrink-0">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>

                                            {/* Title */}
                                            {review.title && (
                                                <p className="font-black text-slate-900 text-sm leading-snug">{review.title}</p>
                                            )}

                                            {/* Comment */}
                                            <p className={`text-slate-600 text-sm leading-relaxed ${!isExpanded ? 'line-clamp-2' : ''}`}>
                                                {review.comment}
                                            </p>
                                            {(review.comment?.length || 0) > 120 && (
                                                <button
                                                    onClick={() => setExpandedId(isExpanded ? null : review.id)}
                                                    className="text-xs font-black text-red-500 hover:text-red-700 transition-colors"
                                                >
                                                    {isExpanded ? 'Show less ↑' : 'Read more ↓'}
                                                </button>
                                            )}

                                            {/* Meta row */}
                                            <div className="flex flex-wrap items-center gap-4 pt-0.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center">
                                                        <UserIcon className="w-3 h-3 text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Reviewer</p>
                                                        <p className="text-xs font-black text-slate-800">{review.user?.fullName || 'Anonymous'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center">
                                                        <Store className="w-3 h-3 text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Business / Owner</p>
                                                        <p className="text-xs font-black text-slate-800">
                                                            {review.business?.name || '—'} 
                                                            <span className="text-slate-400 font-medium mx-1">/</span>
                                                            <span className="text-slate-500">
                                                                {review.business?.vendor?.user?.fullName || (review.business?.vendor as any)?.vendor_user?.fullName || review.business?.vendor?.businessName || 'Anonymous Owner'}
                                                            </span>
                                                        </p>
                                                    </div>
                                                </div>
                                                {review.ipAddress && (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center">
                                                            <Globe className="w-3 h-3 text-slate-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">IP</p>
                                                            <p className="text-xs font-mono font-bold text-slate-700">{review.ipAddress}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {(review.helpfulCount || 0) > 0 && (
                                                    <div className="flex items-center gap-1 text-xs text-slate-400 font-bold ml-auto">
                                                        <ThumbsUp className="w-3 h-3" /> {review.helpfulCount}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Suspicion reason */}
                                            {review.isSuspicious && review.suspicionReason && (
                                                <div className="flex items-start gap-2 p-2.5 bg-orange-50 rounded-xl border border-orange-100">
                                                    <AlertTriangle className="w-3 h-3 text-orange-500 flex-shrink-0 mt-0.5" />
                                                    <p className="text-xs font-bold text-orange-700">{review.suspicionReason}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* ── Three-dot Kebab ── */}
                                        <KebabMenu
                                            review={review}
                                            onModerate={handleModerate}
                                            onDelete={handleDelete}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="flex items-center gap-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-all"
                    >
                        <ChevronLeft className="w-4 h-4" /> Prev
                    </button>
                    <div className="flex gap-1">
                        {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                            const n = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i;
                            return (
                                <button
                                    key={n}
                                    onClick={() => setPage(n)}
                                    className={`w-9 h-9 rounded-xl text-sm font-black transition-all ${page === n ? 'bg-red-600 text-white shadow-md shadow-red-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    {n}
                                </button>
                            );
                        })}
                    </div>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="flex items-center gap-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-all"
                    >
                        Next <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
