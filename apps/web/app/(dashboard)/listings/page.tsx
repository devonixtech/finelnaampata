"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Filter, MoreVertical, Star, MapPin, Eye, MessageSquare, Loader2, ChevronLeft, ChevronRight, X, Lock, Hash, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import AddBusinessModal from '../../../components/business/AddBusinessModal';
import { useAuth } from '../../../context/AuthContext';
import { api, getImageUrl } from '../../../lib/api';
import { ListingImage } from '../../../components/ListingImage';
import { Business } from '../../../types/api';
import { useRouter } from 'next/navigation';
import { FeatureGate } from '../../../components/business/FeatureGate';
import { usePlanFeature } from '../../../hooks/usePlanFeature';
import { motion, AnimatePresence } from 'framer-motion';


const PAGE_SIZE = 9;

export default function BusinessListings() {
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
    const { hasFeature, getFeatureValue } = usePlanFeature();
    const canCreateAlbums = hasFeature('canCreateAlbums');
    const hasKeywords = getFeatureValue('maxKeywords') > 0;
    const isFree = !activeSub || activeSub?.plan?.name?.toLowerCase() === 'free';

    // Keywords Modal State
    const [keywordsModal, setKeywordsModal] = useState<{ id: string, title: string, keywords: string[] } | null>(null);
    const [newKeyword, setNewKeyword] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [albumsModal, setAlbumsModal] = useState<{
        listingId: string;
        title: string;
        albums: any[];
        newAlbumName: string;
    } | null>(null);
    const [albumDrafts, setAlbumDrafts] = useState<Record<string, { name: string; url: string; caption: string }>>({});
    const [albumsError, setAlbumsError] = useState<string | null>(null);

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
        } catch (error: any) {
            console.error('Error updating keywords:', error);
            alert(error?.message || 'Failed to save keywords. Please try again.');
        } finally {
            setActionLoading(null);
        }
    };

    const openAlbumsManager = async (biz: Business) => {
        try {
            setActionLoading('albums-load');
            setAlbumsError(null);
            const albums = await api.listings.getAlbums(biz.id);
            const draftSeed: Record<string, { name: string; url: string; caption: string }> = {};
            (Array.isArray(albums) ? albums : []).forEach((album: any) => {
                draftSeed[album.id] = { name: album.name || '', url: '', caption: '' };
            });
            setAlbumDrafts(draftSeed);
            setAlbumsModal({
                listingId: biz.id,
                title: biz.title,
                albums: Array.isArray(albums) ? albums : [],
                newAlbumName: '',
            });
        } catch (error: any) {
            setAlbumsError(error?.message || 'Failed to load albums');
        } finally {
            setActionLoading(null);
        }
    };

    const reloadAlbums = async (listingId: string) => {
        const albums = await api.listings.getAlbums(listingId);
        const draftSeed: Record<string, { name: string; url: string; caption: string }> = {};
        (Array.isArray(albums) ? albums : []).forEach((album: any) => {
            draftSeed[album.id] = {
                name: albumDrafts[album.id]?.name ?? album.name ?? '',
                url: '',
                caption: '',
            };
        });
        setAlbumDrafts(draftSeed);
        setAlbumsModal((prev) => prev ? { ...prev, albums: Array.isArray(albums) ? albums : [] } : prev);
    };

    const createAlbum = async () => {
        if (!albumsModal || !albumsModal.newAlbumName.trim()) return;
        try {
            setActionLoading('albums-create');
            setAlbumsError(null);
            const albums = await api.listings.createAlbum(albumsModal.listingId, albumsModal.newAlbumName.trim());
            setAlbumsModal({
                ...albumsModal,
                albums: Array.isArray(albums) ? albums : [],
                newAlbumName: '',
            });
        } catch (error: any) {
            setAlbumsError(error?.message || 'Failed to create album');
        } finally {
            setActionLoading(null);
        }
    };

    const renameAlbum = async (albumId: string, name: string) => {
        if (!albumsModal) return;
        try {
            setActionLoading(`album-rename-${albumId}`);
            setAlbumsError(null);
            await api.listings.renameAlbum(albumsModal.listingId, albumId, name);
            await reloadAlbums(albumsModal.listingId);
        } catch (error: any) {
            setAlbumsError(error?.message || 'Failed to rename album');
        } finally {
            setActionLoading(null);
        }
    };

    const deleteAlbum = async (albumId: string) => {
        if (!albumsModal) return;
        try {
            setActionLoading(`album-delete-${albumId}`);
            setAlbumsError(null);
            await api.listings.deleteAlbum(albumsModal.listingId, albumId);
            await reloadAlbums(albumsModal.listingId);
        } catch (error: any) {
            setAlbumsError(error?.message || 'Failed to delete album');
        } finally {
            setActionLoading(null);
        }
    };

    const addAlbumImage = async (album: any, url: string, caption: string) => {
        if (!albumsModal || !url.trim()) return;
        const images = Array.isArray(album.images) ? [...album.images] : [];
        images.push({
            id: crypto.randomUUID(),
            url: url.trim(),
            caption: caption.trim(),
            sortOrder: images.length,
        });
        try {
            setActionLoading(`album-image-${album.id}`);
            setAlbumsError(null);
            await api.listings.upsertAlbumImages(albumsModal.listingId, album.id, images);
            await reloadAlbums(albumsModal.listingId);
        } catch (error: any) {
            setAlbumsError(error?.message || 'Failed to add album image');
        } finally {
            setActionLoading(null);
        }
    };

    const removeAlbumImage = async (album: any, imageId: string) => {
        if (!albumsModal) return;
        const images = (Array.isArray(album.images) ? album.images : [])
            .filter((img: any) => img.id !== imageId)
            .map((img: any, idx: number) => ({ ...img, sortOrder: idx }));
        try {
            setActionLoading(`album-image-${album.id}`);
            setAlbumsError(null);
            await api.listings.upsertAlbumImages(albumsModal.listingId, album.id, images);
            await reloadAlbums(albumsModal.listingId);
        } catch (error: any) {
            setAlbumsError(error?.message || 'Failed to remove album image');
        } finally {
            setActionLoading(null);
        }
    };

    const moveAlbumImage = async (album: any, imageId: string, direction: 'up' | 'down') => {
        if (!albumsModal) return;
        const original = Array.isArray(album.images) ? [...album.images] : [];
        const index = original.findIndex((img: any) => img.id === imageId);
        if (index < 0) return;
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= original.length) return;
        const [moved] = original.splice(index, 1);
        original.splice(targetIndex, 0, moved);
        const reordered = original.map((img: any, idx: number) => ({ ...img, sortOrder: idx }));
        try {
            setActionLoading(`album-image-${album.id}`);
            setAlbumsError(null);
            await api.listings.upsertAlbumImages(albumsModal.listingId, album.id, reordered);
            await reloadAlbums(albumsModal.listingId);
        } catch (error: any) {
            setAlbumsError(error?.message || 'Failed to reorder album images');
        } finally {
            setActionLoading(null);
        }
    };

    const updateAlbumImageCaption = async (album: any, imageId: string, caption: string) => {
        if (!albumsModal) return;
        const images = (Array.isArray(album.images) ? [...album.images] : []).map((img: any, idx: number) => ({
            ...img,
            caption: img.id === imageId ? caption : img.caption,
            sortOrder: idx,
        }));
        try {
            setActionLoading(`album-image-${album.id}`);
            setAlbumsError(null);
            await api.listings.upsertAlbumImages(albumsModal.listingId, album.id, images);
            await reloadAlbums(albumsModal.listingId);
        } catch (error: any) {
            setAlbumsError(error?.message || 'Failed to update image caption');
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
        <FeatureGate feature="showListings" title="My Business Listings" description="Manage all your business listings from one central dashboard. Track their status and performance with ease.">
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
                                                const currentKeywords = biz.searchKeywords ||
                                                    (biz.metaKeywords ? biz.metaKeywords.split(',').map((k: string) => k.trim()).filter(Boolean) : []);

                                                setKeywordsModal({
                                                    id: biz.id,
                                                    title: biz.title,
                                                    keywords: currentKeywords,
                                                });
                                            }}
                                            className="w-full flex items-center justify-center gap-2 py-4 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl font-black text-xs hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all active:scale-95"
                                        >
                                            <Hash className="w-4 h-4" /> Manage Search Keywords
                                        </button>
                                        <button
                                            onClick={() => openAlbumsManager(biz)}
                                            className="w-full flex items-center justify-center gap-2 py-4 bg-amber-50 text-amber-700 border border-amber-100 rounded-2xl font-black text-xs hover:bg-amber-600 hover:text-white hover:border-amber-600 transition-all active:scale-95"
                                        >
                                            <Plus className="w-4 h-4" /> Manage Albums
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
                                {hasKeywords ? null : (
                                    <div className="absolute inset-0 z-10 backdrop-blur-md bg-white/95 flex flex-col items-center justify-center p-8 text-center rounded-[2rem]">
                                        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-6 shadow-xl shadow-amber-500/20">
                                            <Lock className="w-8 h-8 text-white" />
                                        </div>
                                        <h4 className="text-2xl font-black text-slate-900 mb-3">Premium Feature</h4>
                                        <p className="text-sm font-bold text-slate-600 mb-8 max-w-xs leading-relaxed">Upgrade your plan to unlock Search Keywords and improve your listing's visibility.</p>
                                        <div className="flex items-center gap-3 w-full max-w-xs">
                                            <button onClick={() => setKeywordsModal(null)} className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-sm rounded-xl transition-all">Close</button>
                                            <Link href="/subscription" className="flex-[2] py-3.5 bg-slate-900 hover:bg-black text-white font-black text-sm rounded-xl transition-all shadow-xl shadow-slate-900/20 text-center">Upgrade Plan</Link>
                                        </div>
                                    </div>
                                )}
                                <div className="absolute top-0 left-0 w-full h-2 bg-blue-500" />
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center">
                                        <Hash className="w-8 h-8 text-blue-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-xl font-black text-slate-900 truncate">Search Keywords</h3>
                                        <p className="text-slate-400 font-medium text-sm truncate">Plan limits are enforced on save.</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newKeyword}
                                            onChange={(e) => setNewKeyword(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && newKeyword.trim()) {
                                                    const kw = newKeyword.trim().toLowerCase();
                                                    if (!keywordsModal.keywords.includes(kw)) {
                                                        setKeywordsModal({ ...keywordsModal, keywords: [...keywordsModal.keywords, kw] });
                                                    }
                                                    setNewKeyword('');
                                                }
                                            }}
                                            placeholder="Add keyword and press Enter..."
                                            className="flex-1 px-5 py-3.5 rounded-2xl border border-slate-100 bg-slate-50 text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-blue-50 placeholder:text-slate-300 text-sm"
                                        />
                                        <button
                                            onClick={() => {
                                                if (newKeyword.trim()) {
                                                    const kw = newKeyword.trim().toLowerCase();
                                                    if (!keywordsModal.keywords.includes(kw)) {
                                                        setKeywordsModal({ ...keywordsModal, keywords: [...keywordsModal.keywords, kw] });
                                                    }
                                                    setNewKeyword('');
                                                }
                                            }}
                                            disabled={!newKeyword.trim()}
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

                <AnimatePresence>
                    {albumsModal && (
                        <div className="fixed inset-0 z-[101] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-white rounded-[2rem] p-8 max-w-3xl w-full shadow-2xl relative overflow-hidden text-left max-h-[90vh] overflow-y-auto"
                            >
                                {canCreateAlbums ? null : (
                                    <div className="absolute inset-0 z-10 backdrop-blur-md bg-white/95 flex flex-col items-center justify-center p-8 text-center rounded-[2rem]">
                                        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-6 shadow-xl shadow-amber-500/20">
                                            <Lock className="w-8 h-8 text-white" />
                                        </div>
                                        <h4 className="text-2xl font-black text-slate-900 mb-3">Premium Feature</h4>
                                        <p className="text-sm font-bold text-slate-600 mb-8 max-w-xs leading-relaxed">Upgrade your plan to manage Albums and showcase your business visually.</p>
                                        <div className="flex items-center gap-3 w-full max-w-xs">
                                            <button onClick={() => setAlbumsModal(null)} className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-sm rounded-xl transition-all">Close</button>
                                            <Link href="/subscription" className="flex-[2] py-3.5 bg-slate-900 hover:bg-black text-white font-black text-sm rounded-xl transition-all shadow-xl shadow-slate-900/20 text-center">Upgrade Plan</Link>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900">Albums</h3>
                                        <p className="text-sm font-bold text-slate-400">{albumsModal.title}</p>
                                    </div>
                                    <button
                                        onClick={() => setAlbumsModal(null)}
                                        className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
                                    >
                                        <X className="w-4 h-4 text-slate-600" />
                                    </button>
                                </div>
                                {albumsError && (
                                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                                        <p className="text-xs font-bold text-red-700">{albumsError}</p>
                                    </div>
                                )}

                                <div className="flex gap-2 mb-6">
                                    <input
                                        value={albumsModal.newAlbumName}
                                        onChange={(e) => setAlbumsModal({ ...albumsModal, newAlbumName: e.target.value })}
                                        placeholder="New album name"
                                        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold"
                                    />
                                    <button
                                        onClick={createAlbum}
                                        disabled={actionLoading === 'albums-create'}
                                        className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-black disabled:opacity-50"
                                    >
                                        {actionLoading === 'albums-create' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {albumsModal.albums.map((album: any) => {
                                        const draft = albumDrafts[album.id] || { name: album.name || '', url: '', caption: '' };
                                        return (
                                            <div key={album.id} className="border border-slate-200 rounded-2xl p-4">
                                                <div className="flex gap-2 mb-4">
                                                    <input
                                                        value={draft.name}
                                                        onChange={(e) => setAlbumDrafts((prev) => ({ ...prev, [album.id]: { ...draft, name: e.target.value } }))}
                                                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold"
                                                    />
                                                    <button
                                                        onClick={() => renameAlbum(album.id, draft.name)}
                                                        disabled={actionLoading === `album-rename-${album.id}`}
                                                        className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => deleteAlbum(album.id)}
                                                        disabled={actionLoading === `album-delete-${album.id}`}
                                                        className="px-4 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-black border border-red-100"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                                                    <input
                                                        value={draft.url}
                                                        onChange={(e) => setAlbumDrafts((prev) => ({ ...prev, [album.id]: { ...draft, url: e.target.value } }))}
                                                        placeholder="Image URL"
                                                        className="sm:col-span-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
                                                    />
                                                    <input
                                                        value={draft.caption}
                                                        onChange={(e) => setAlbumDrafts((prev) => ({ ...prev, [album.id]: { ...draft, caption: e.target.value } }))}
                                                        placeholder="Caption"
                                                        className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
                                                    />
                                                </div>
                                                <button
                                                    onClick={async () => {
                                                        await addAlbumImage(album, draft.url, draft.caption);
                                                        setAlbumDrafts((prev) => ({ ...prev, [album.id]: { ...draft, url: '', caption: '' } }));
                                                    }}
                                                    disabled={actionLoading === `album-image-${album.id}` || !draft.url.trim()}
                                                    className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-black border border-blue-100 disabled:opacity-50"
                                                >
                                                    Add Image
                                                </button>

                                                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                    {(album.images || []).map((img: any) => (
                                                        <div key={img.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                                                            <img src={img.url} alt={img.caption || 'album'} className="w-full h-20 object-cover" />
                                                        <div className="p-2">
                                                                <input
                                                                    defaultValue={img.caption || ''}
                                                                    onBlur={(e) => {
                                                                        const next = e.target.value.trim();
                                                                        if (next !== (img.caption || '')) {
                                                                            updateAlbumImageCaption(album, img.id, next);
                                                                        }
                                                                    }}
                                                                    className="w-full text-[10px] font-bold text-slate-600 border border-slate-200 rounded px-1.5 py-1"
                                                                    placeholder="Caption"
                                                                />
                                                                <div className="mt-1.5 flex items-center justify-between">
                                                                    <div className="flex gap-1">
                                                                        <button
                                                                            onClick={() => moveAlbumImage(album, img.id, 'up')}
                                                                            className="text-[9px] font-black text-slate-500"
                                                                        >
                                                                            Up
                                                                        </button>
                                                                        <button
                                                                            onClick={() => moveAlbumImage(album, img.id, 'down')}
                                                                            className="text-[9px] font-black text-slate-500"
                                                                        >
                                                                            Down
                                                                        </button>
                                                                    </div>
                                                                <button
                                                                    onClick={() => removeAlbumImage(album, img.id)}
                                                                    className="mt-2 text-[10px] font-black text-red-600"
                                                                >
                                                                    Remove
                                                                </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {albumsModal.albums.length === 0 && (
                                        <p className="text-sm font-bold text-slate-400 text-center py-6">No albums yet.</p>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </FeatureGate>
    );
}

