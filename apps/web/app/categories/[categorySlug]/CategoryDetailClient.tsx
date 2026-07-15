"use client";

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Business, Category, City } from '@/types/api';
import BusinessCard from '@/components/BusinessCard';
import OfferCard from '@/components/OfferCard';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Loader2, AlertCircle, ChevronRight, MapPin, Search, Star, Filter, ArrowUpRight, Activity, Clock, ShieldCheck, CheckCircle2, Navigation, Heart, Share2, Phone, Mail, Instagram, Facebook, Globe, Twitter, ArrowRight, LayoutGrid, List } from "lucide-react";
import { SearchableSelect } from "../../../components/ui/SearchableSelect";
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface CategoryDetailClientProps {
    slug: string;
}

export default function CategoryDetailClient({ slug }: CategoryDetailClientProps) {
    const router = useRouter();
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [category, setCategory] = useState<Category | null>(null);
    const [cities, setCities] = useState<City[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState<string>('relevance');
    const [categoryOffers, setCategoryOffers] = useState<any[]>([]);
    const [offersLoading, setOffersLoading] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState({
        city: '',
        minRating: 0,
        priceRange: '',
        verifiedOnly: false,
        featuredOnly: false,
        openNow: false
    });

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const citiesData = await api.cities.getAll();
                setCities(citiesData || []);
            } catch (err) {
                console.error('Failed to load cities:', err);
            }
        };
        loadInitialData();
    }, []);

    useEffect(() => {
        const loadCategoryData = async () => {
            let actualSlug = slug;

            // Handle SPA fallback where the page is served by a 'template' HTML file
            if ((slug === 'template' || slug === 'general' || slug === 'all') && typeof window !== 'undefined') {
                const pathParts = window.location.pathname.split('/').filter(Boolean);
                // URL structure: /categories/slug/ or /categories/slug
                if (pathParts[0] === 'categories' && pathParts[1] && pathParts[1] !== 'template' && pathParts[1] !== 'all') {
                    actualSlug = pathParts[1];
                    console.log('[CategoryDetail] Fallback detected, using actual slug from URL:', actualSlug);
                }
            }

            if (!actualSlug) return;
            const normalizedSlug = (actualSlug as string).toLowerCase();
            setLoading(true);

            try {
                const catData = await api.categories.getBySlug(normalizedSlug);
                setCategory(catData);

                const searchParams = {
                    categoryId: catData.id,
                    limit: 50,
                    sortBy: sortBy === 'relevance' ? undefined : sortBy,
                    city: filters.city,
                    minRating: filters.minRating || undefined,
                    priceRange: filters.priceRange,
                    verifiedOnly: filters.verifiedOnly,
                    featuredOnly: filters.featuredOnly,
                    openNow: filters.openNow
                };
                const searchRes = await api.listings.search(searchParams);
                setBusinesses(searchRes.data);

                // Load category offers
                try {
                    setOffersLoading(true);
                    const offersRes = await api.offers.search({
                        categoryId: catData.id,
                        placement: 'category',
                        limit: 20
                    });
                    setCategoryOffers(offersRes.data);
                } catch (err) {
                    console.error('Failed to load category offers:', err);
                } finally {
                    setOffersLoading(false);
                }
            } catch (err: any) {
                console.error('[CategoryDetail] Fetch error:', err);
                setError(err.message || 'Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };
        loadCategoryData();
    }, [slug, filters, sortBy]);

    if (loading && !category) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 py-32 flex flex-col items-center">
                    <div className="w-12 h-12 border-t-2 border-blue-600 rounded-full animate-spin mb-6" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading Collections</p>
                </div>
                <Footer />
            </div>
        );
    }

    if (!category && !loading) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 py-32 text-center">
                    <h1 className="text-6xl font-black text-slate-900 mb-6 tracking-tighter">Not Found.</h1>
                    <p className="text-slate-400 font-bold mb-10">This category collection does not exist.</p>
                    <Link href="/categories" className="text-blue-600 font-black uppercase tracking-widest text-xs border-b-2 border-blue-600 pb-1">Return to Index</Link>
                </div>
                <Footer />
            </div>
        );
    }

    if (!category) return null;

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            {/* Minimalist Sub-Header */}
            <div className="bg-white border-b border-slate-50 pt-10 pb-16 lg:pt-16 lg:pb-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 mb-10">
                        <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
                        <ChevronRight className="w-3 h-3 text-slate-200" />
                        <Link href="/categories" className="hover:text-blue-600 transition-colors">Categories</Link>
                        <ChevronRight className="w-3 h-3 text-slate-200" />
                        <span className="text-slate-900">{category.name}</span>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
                        <div className="max-w-3xl">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                                    Premium Service
                                </div>
                                {businesses.some(b => b.isVerified) && (
                                    <div className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                        <ShieldCheck className="w-3.5 h-3.5" /> Recommended Businesses
                                    </div>
                                )}
                            </div>
                            <h1 className="text-5xl lg:text-7xl font-black text-slate-900 mb-8 tracking-tighter leading-[0.9]">
                                Best {category.name} <br />
                                <span className="text-blue-600">in Pakistan.</span>
                            </h1>
                            <p className="text-xl text-slate-400 font-bold leading-relaxed max-w-xl">
                                {category.description || `A curated selection of the most reliable and highly-rated ${category.name.toLowerCase()} businesses.`}
                            </p>
                        </div>

                        <div className="flex items-center gap-8 bg-[#F8FAFC] p-8 rounded-[20px] border border-slate-100/50">
                            <div>
                                <div className="text-4xl font-black text-slate-900 leading-none mb-1">{businesses.length}</div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Listings Found</div>
                            </div>
                            <div className="w-px h-12 bg-slate-200" />
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                                <Activity className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Specific Offers */}
            <AnimatePresence>
                {categoryOffers.length > 0 && (
                    <div className="bg-slate-50 py-20 border-b border-slate-100">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex items-center gap-4 mb-12">
                                <div className="h-px w-12 bg-orange-200" />
                                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-orange-500">
                                    Exclusive {category.name} Deals
                                </h2>
                            </div>

                            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                {categoryOffers.map((offer) => (
                                    <motion.div
                                        key={offer.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <OfferCard
                                            offer={offer}
                                            onEnquire={() => router.push(`/offers-events/${offer.id}`)}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="flex flex-col lg:grid lg:grid-cols-12 gap-16">
                    {/* Minimal Filters Sidebar */}
                    <aside className="lg:col-span-3">
                        <div className="sticky top-28 space-y-12">
                            <div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 mb-8 flex items-center gap-2">
                                    <Filter className="w-3.5 h-3.5" /> Refine Search
                                </h3>

                                <div className="space-y-10">
                                    {/* Location Select */}
                                    <div className="space-y-4">
                                        <label className="text-xs font-black text-slate-900 tracking-tight">Geo Location</label>
                                        <div className="relative z-50">
                                            <SearchableSelect
                                                value={filters.city}
                                                onChange={val => setFilters(prev => ({ ...prev, city: val as string }))}
                                                options={[
                                                    { label: "All Pakistan", value: "" },
                                                    ...cities.map(city => ({ label: city.name, value: city.name }))
                                                ]}
                                                placeholder="All Pakistan"
                                            />
                                        </div>
                                    </div>

                                    {/* Rating Select */}
                                    <div className="space-y-4">
                                        <label className="text-xs font-black text-slate-900 tracking-tight">Minimum Rating</label>
                                        <div className="flex flex-wrap gap-2">
                                            {[0, 3, 4, 4.5].map(rating => (
                                                <button
                                                    key={rating}
                                                    onClick={() => setFilters(prev => ({ ...prev, minRating: rating }))}
                                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filters.minRating === rating ? 'bg-slate-900 text-white' : 'bg-[#F8FAFC] text-slate-400 hover:text-slate-900 border border-slate-100'}`}
                                                >
                                                    {rating === 0 ? 'Any' : `${rating}+`}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Availability Toggles */}
                                    <div className="space-y-6 pt-4">
                                        {[
                                            { key: 'verifiedOnly', label: 'Recommended Only' },
                                            { key: 'featuredOnly', label: 'Recommended' },
                                            { key: 'openNow', label: 'Currently Open' }
                                        ].map(item => (
                                            <label key={item.key} className="flex items-center justify-between cursor-pointer group">
                                                <span className="text-xs font-bold text-slate-500 group-hover:text-slate-900 transition-colors">{item.label}</span>
                                                <input
                                                    type="checkbox"
                                                    checked={filters[item.key as keyof typeof filters] as boolean}
                                                    onChange={() => setFilters(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof filters] }))}
                                                    className="w-4 h-4 rounded border-slate-200 text-blue-600 focus:ring-blue-500/10"
                                                />
                                            </label>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => setFilters({ city: '', minRating: 0, priceRange: '', verifiedOnly: false, featuredOnly: false, openNow: false })}
                                        className="w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 hover:text-red-500 transition-colors"
                                    >
                                        Reset Parameters
                                    </button>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Results Content Area */}
                    <div className="lg:col-span-9">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16">
                            <div className="flex items-center gap-4">
                                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-300">
                                    {businesses.length} Curated Results
                                </h2>
                                <div className="h-px w-10 bg-slate-100" />
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="relative z-50 mr-4 w-40">
                                    <SearchableSelect
                                        value={sortBy}
                                        onChange={val => setSortBy(val as string)}
                                        options={[
                                            { label: "By Significance", value: "relevance" },
                                            { label: "Top Performance", value: "rating" },
                                            { label: "Recent Listing", value: "newest" }
                                        ]}
                                    />
                                </div>

                                <div className="flex items-center gap-4">
                                    <button onClick={() => setViewMode('grid')} className={`p-1 transition-all ${viewMode === 'grid' ? 'text-blue-600' : 'text-slate-200 hover:text-slate-400'}`}>
                                        <LayoutGrid className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => setViewMode('list')} className={`p-1 transition-all ${viewMode === 'list' ? 'text-blue-600' : 'text-slate-200 hover:text-slate-400'}`}>
                                        <List className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {businesses.length > 0 ? (
                            <div className={viewMode === 'grid' ? "grid sm:grid-cols-2 gap-x-10 gap-y-16" : "space-y-16"}>
                                {businesses.map((biz) => (
                                    <BusinessCard
                                        key={biz.id}
                                        business={biz}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="py-40 text-center">
                                <h3 className="text-4xl font-black text-slate-900 mb-6 tracking-tighter">Zero Matches.</h3>
                                <p className="text-slate-400 font-bold mb-10">Your current parameters returned no results.</p>
                                <button
                                    onClick={() => setFilters({ city: '', minRating: 0, priceRange: '', verifiedOnly: false, featuredOnly: false, openNow: false })}
                                    className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95"
                                >
                                    Reset Discovery
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
