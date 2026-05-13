"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Filter, MoreVertical, Star, MapPin, Eye, MessageSquare, Loader2, ChevronLeft, ChevronRight, X, Lock, Hash, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import AddBusinessModal from '../../../components/vendor/AddBusinessModal';
import { useAuth } from '../../../context/AuthContext';
import { api, getImageUrl } from '../../../lib/api';
import { ListingImage } from '../../../components/ListingImage';
import { Business } from '../../../types/api';
import { useRouter } from 'next/navigation';
import { FeatureGate } from '../../../components/vendor/FeatureGate';
import { motion, AnimatePresence } from 'framer-motion';

const PAGE_SIZE = 9;

export default function VendorListings() {
    const router = useRouter();
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
    const [listings, setListings] = useState<Business[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState<'newest' | 'rated' | 'views'>('newest');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const isAuthorized = user?.role === 'vendor' || user?.role === 'admin' || user?.role === 'superadmin';
    const isVendor = user?.role === 'vendor';
    const activeSub = user?.vendor?.subscriptions?.find((sub: any) => sub.status === 'active');
    const features = activeSub?.plan?.dashboardFeatures || {};

    // Keywords Modal State
    const [keywordsModal, setKeywordsModal] = useState<{ id: string, title: string, keywords: string[], limit: number } | null>(null);
    const [newKeyword, setNewKeyword] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchListings = async () => {
        try {
            setLoading(true);
            const response = await api.listings.getMyListings();
            setListings(response.data || []);
            setCurrentPage(1);
        } catch (error) {
            console.error('Error fetching listings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchListings();
        }
    }, [user]);

    const handleEdit = (biz: Business) => {
        setEditingBusiness(biz);
        setIsModalOpen(true);
    };

    const updateKeywords = async (id: string, keywords: string[]) => {
        try {
            setActionLoading('keywords');
            await api.listings.update(id, { searchKeywords: keywords });
            setListings(prev => prev.map(b => b.id === id ? { ...b, searchKeywords: keywords } : b));
            setKeywordsModal(null);
            setNewKeyword('');
        } catch (error) {
            console.error('Error updating keywords:', error);
            alert('Failed to save keywords. Please try again.');
        } finally {
            setActionLoading(null);
        }
    };

    // ── Derived: filter + sort ──────────────────────────────────────────
    const filteredListings = useMemo(() => {
        let result = [...listings];

        // Search — match title, city, category name
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(b =>
                (b as any).title?.toLowerCase().includes(q) ||
                (b as any).city?.toLowerCase().includes(q) ||
                (b as any).category?.name?.toLowerCase().includes(q) ||
                (b as any).description?.toLowerCase().includes(q)
            );
        }

        // Status filter (case-insensitive)
        if (statusFilter !== 'all') {
            result = result.filter(b => ((b as any).status || '').toLowerCase() === statusFilter);
        }

        // Sort — use explicit number coercion so PostgreSQL decimal strings sort correctly
        if (sortOrder === 'rated') {
            result.sort((a, b) => parseFloat((b as any).averageRating || '0') - parseFloat((a as any).averageRating || '0'));
        } else if (sortOrder === 'views') {
            result.sort((a, b) => Number((b as any).totalViews || 0) - Number((a as any).totalViews || 0));
        } else {
            // newest — sort by createdAt descending
            result.sort((a, b) => new Date((b as any).createdAt || 0).getTime() - new Date((a as any).createdAt || 0).getTime());
        }

        return result;
    }, [listings, searchQuery, sortOrder, statusFilter]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, sortOrder, statusFilter]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentPage]);

    const totalPages = Math.ceil(filteredListings.length / PAGE_SIZE);
    const paginatedListings = filteredListings.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    return (
        <FeatureGate feature="showListings" title="My Business Listings" description="Manage all your verified business listings from one central dashboard. Track their status and performance with ease.">
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl lg:text-5xl font-black text-slate-900 mb-2 tracking-tight">Your Listings</h1>
                        <p className="text-slate-400 font-bold tracking-tight text-lg">Manage your business listings and their status</p>
                    </div>
                    {isAuthorized && (
                        <Link href="/add-listing" className="flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black  shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 whitespace-nowrap">
                            <Plus className="w-5 h-5" /> Add New Listing
                        </Link>
                    )}
                </div>


                <AddBusinessModal
                    isOpen={isModalOpen}
                    business={editingBusiness}
                    onClose={() => { setIsModalOpen(false); setEditingBusiness(null); }}
                    onSuccess={() => { fetchListings(); }}
                />

                {/* Filters Bar */}
                <div className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm space-y-3">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-grow relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search by title, city, or category..."
                                className="w-full pl-12 pr-10 py-3 bg-slate-50 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 transition-all">
                                    <X className="w-3 h-3 text-slate-600" />
                                </button>
                            )}
                        </div>

                        {/* Sort */}
                        <select
                            value={sortOrder}
                            onChange={e => setSortOrder(e.target.value as any)}
                            className="px-6 py-3 bg-slate-50 text-slate-600 rounded-2xl font-bold border border-transparent hover:border-slate-200 transition-all outline-none"
                        >
                            <option value="newest">Recent First</option>
                            <option value="rated">Highest Rated</option>
                            <option value="views">Most Views</option>
                        </select>
                    </div>

                    {/* Status Filter Pills */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <Filter className="w-4 h-4 text-slate-400" />
                        {(['all', 'pending', 'approved', 'rejected'] as const).map(s => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all ${statusFilter === s
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }`}
                            >
                                {s === 'all' ? 'All' : s}
                            </button>
                        ))}
                        {(searchQuery || statusFilter !== 'all' || sortOrder !== 'newest') && (
                            <button
                                onClick={() => { setSearchQuery(''); setStatusFilter('all'); setSortOrder('newest'); }}
                                className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-red-50 text-red-500 hover:bg-red-100 transition-all"
                            >
                                Clear All
                            </button>
                        )}
                        <span className="ml-auto text-xs text-slate-400 font-bold">
                            {filteredListings.length} result{filteredListings.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>

                {/* Boost Banner */}
                <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 flex flex-col sm:flex-row items-center gap-4">
                    {/* <div className="w-11 h-11 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"></div> */}
                    <div className="flex-1 text-center sm:text-left">
                        <p className="font-black text-slate-900 text-sm">Boost Offers & Events on Your Listings</p>
                        <p className="text-xs font-bold text-slate-500 mt-0.5">Feature your deals on the homepage, category pages & search results with a plan starting from PKR 100</p>
                    </div>
                    <Link href="/offer-plans" className="flex-shrink-0 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black text-xs transition-colors whitespace-nowrap">
                        View Plans →
                    </Link>
                </div>

                {/* Listings Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {loading ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                            <p className="text-slate-400 font-bold uppercase tracking-widest">Loading your listings...</p>
                        </div>
                    ) : paginatedListings.length > 0 ? (
                        paginatedListings.map((biz: any) => (
                            <div key={biz.id} className="group bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 flex flex-col relative">
                                <div className="relative h-64 overflow-hidden">
                                    <ListingImage
                                        src={biz.coverImageUrl || biz.images?.[0]}
                                        alt={biz.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                                    
                                    <div className="absolute top-6 left-6">
                                        <span className={`px-4 py-2 bg-white/90 backdrop-blur-md rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg ${biz.status === 'approved' ? 'text-green-600' :
                                            biz.status === 'rejected' ? 'text-red-500' : 'text-amber-600'
                                            }`}>{biz.status}</span>
                                    </div>
                                    
                                    <div className="absolute bottom-6 left-6 right-6">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80 mb-2 block">{biz.category?.name || 'Business'}</span>
                                        <h3 className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors leading-tight line-clamp-1">{biz.title}</h3>
                                    </div>
                                </div>

                                <div className="p-8 flex-grow flex flex-col">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
                                            <MapPin className="w-4 h-4 text-blue-500" />
                                            <span className="truncate">{biz.city || biz.location || 'Location'}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-xl border border-amber-100/50">
                                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                            <span className="text-xs font-black text-amber-600">{biz.averageRating || 0}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3 group/stat hover:bg-blue-50 transition-colors">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover/stat:scale-110 transition-transform">
                                                <Eye className="w-4 h-4 text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Views</p>
                                                <p className="text-sm font-black text-slate-900">{biz.totalViews || 0}</p>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3 group/stat hover:bg-orange-50 transition-colors">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover/stat:scale-110 transition-transform">
                                                <MessageSquare className="w-4 h-4 text-orange-500" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Reviews</p>
                                                <p className="text-sm font-black text-slate-900">{biz.totalReviews || 0}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 mt-8">
                                        <div className="grid grid-cols-2 gap-3">
                                            <button onClick={() => handleEdit(biz)} className="py-4 px-4 bg-slate-900 text-white rounded-2xl font-black text-xs hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-slate-900/10">
                                                Edit Details
                                            </button>
                                            <Link href={`/business/${biz.slug}`} className="py-4 px-4 bg-white text-slate-900 border border-slate-200 rounded-2xl font-black text-xs hover:bg-slate-50 transition-all active:scale-95 text-center">
                                                View Page
                                            </Link>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const limit = activeSub?.plan?.dashboardFeatures?.maxKeywords || 15;
                                                const currentKeywords = biz.searchKeywords ||
                                                    (biz.metaKeywords ? biz.metaKeywords.split(',').map((k: string) => k.trim()).filter(Boolean) : []);

                                                setKeywordsModal({
                                                    id: biz.id,
                                                    title: biz.title,
                                                    keywords: currentKeywords,
                                                    limit
                                                });
                                            }}
                                            className="w-full flex items-center justify-center gap-2 py-4 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl font-black text-xs hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all active:scale-95"
                                        >
                                            <Hash className="w-4 h-4" /> Manage Search Keywords
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-20 bg-slate-50 rounded-[20px] border-2 border-dashed border-slate-200">
                            <p className="text-slate-400 font-bold italic text-lg">
                                {searchQuery || statusFilter !== 'all' ? 'No listings match your search.' : "You haven't added any listings yet."}
                            </p>
                            {(searchQuery || statusFilter !== 'all') && (
                                <button onClick={() => { setSearchQuery(''); setStatusFilter('all'); }} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 transition-all">
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Pagination Bar */}
                {!loading && totalPages > 1 && (
                    <div className="flex items-center justify-between bg-white border border-slate-100 rounded-2xl px-6 py-4 shadow-sm">
                        <p className="text-sm font-bold text-slate-500">
                            Showing <span className="text-slate-900">{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredListings.length)}</span> of <span className="text-slate-900">{filteredListings.length}</span> listings
                        </p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button key={page} onClick={() => setCurrentPage(page)}
                                    className={`w-9 h-9 rounded-xl text-sm font-black transition-all ${page === currentPage ? 'bg-slate-900 text-white shadow' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                    {page}
                                </button>
                            ))}
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Keywords Modal */}
                <AnimatePresence>
                    {keywordsModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-white rounded-[2rem] p-10 max-w-lg w-full shadow-2xl relative overflow-hidden text-left"
                            >
                                <div className="absolute top-0 left-0 w-full h-2 bg-blue-500" />
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center">
                                        <Hash className="w-8 h-8 text-blue-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-xl font-black text-slate-900 truncate">Search Keywords</h3>
                                        <p className="text-slate-400 font-medium text-sm truncate">Limit: {keywordsModal.keywords.length} / {keywordsModal.limit}</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newKeyword}
                                            onChange={(e) => setNewKeyword(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && newKeyword.trim() && keywordsModal.keywords.length < keywordsModal.limit) {
                                                    const kw = newKeyword.trim().toLowerCase();
                                                    if (!keywordsModal.keywords.includes(kw)) {
                                                        setKeywordsModal({ ...keywordsModal, keywords: [...keywordsModal.keywords, kw] });
                                                    }
                                                    setNewKeyword('');
                                                }
                                            }}
                                            disabled={keywordsModal.keywords.length >= keywordsModal.limit}
                                            placeholder={keywordsModal.keywords.length >= keywordsModal.limit ? "Limit reached" : "Add keyword and press Enter..."}
                                            className="flex-1 px-5 py-3.5 rounded-2xl border border-slate-100 bg-slate-50 text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-blue-50 placeholder:text-slate-300 text-sm"
                                        />
                                        <button
                                            onClick={() => {
                                                if (newKeyword.trim() && keywordsModal.keywords.length < keywordsModal.limit) {
                                                    const kw = newKeyword.trim().toLowerCase();
                                                    if (!keywordsModal.keywords.includes(kw)) {
                                                        setKeywordsModal({ ...keywordsModal, keywords: [...keywordsModal.keywords, kw] });
                                                    }
                                                    setNewKeyword('');
                                                }
                                            }}
                                            disabled={!newKeyword.trim() || keywordsModal.keywords.length >= keywordsModal.limit}
                                            className="p-3.5 bg-blue-500 text-white rounded-2xl disabled:opacity-50"
                                        >
                                            <CheckCircle2 className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1 rounded-xl">
                                        {keywordsModal.keywords.map((kw, i) => (
                                            <span key={i} className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-bold text-xs uppercase tracking-wider">
                                                #{kw}
                                                <XCircle
                                                    className="w-4 h-4 text-slate-400 hover:text-red-500 cursor-pointer"
                                                    onClick={() => setKeywordsModal({ ...keywordsModal, keywords: keywordsModal.keywords.filter(k => k !== kw) })}
                                                />
                                            </span>
                                        ))}
                                        {keywordsModal.keywords.length === 0 && (
                                            <p className="text-slate-300 text-sm italic font-medium w-full text-center py-4">No keywords assigned yet.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-10">
                                    <button
                                        onClick={() => { setKeywordsModal(null); setNewKeyword(''); }}
                                        className="px-6 py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-[20px] font-black text-sm transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => updateKeywords(keywordsModal.id, keywordsModal.keywords)}
                                        disabled={!!actionLoading}
                                        className="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[20px] font-black text-sm shadow-blue-500/30 transition-all disabled:opacity-50"
                                    >
                                        {actionLoading?.includes('keywords') ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Save Keywords'}
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
