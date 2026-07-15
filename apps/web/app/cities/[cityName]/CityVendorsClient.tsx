"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, ArrowLeft, Search, Users, SlidersHorizontal } from 'lucide-react';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import VendorProfileCard from '../../../components/VendorProfileCard';
import { api } from '../../../lib/api';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';

interface CityVendorsClientProps {
    city: string;
}

export default function CityVendorsClient({ city }: CityVendorsClientProps) {
    // decode URL segment: "lahore" → "lahore", "New%20Delhi" → "New Delhi"
    let effectiveCity = city || '';

    // Handle SPA fallback where the route might be served by a 'template' HTML file
    if ((city === 'template' || city === 'default-city' || city === 'default') && typeof window !== 'undefined') {
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        // URL structure: /cities/name/ or /cities/name
        if (pathParts[0] === 'cities' && pathParts[1] && pathParts[1] !== 'template' && pathParts[1] !== 'default') {
            effectiveCity = pathParts[1];
            console.log('[CityVendors] Fallback detected, using actual city from URL:', effectiveCity);
        }
    }

    const citySlug = decodeURIComponent(effectiveCity);
    // Capitalize each word for display
    const cityName = citySlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    const [vendors, setVendors] = useState<any[]>([]);
    const [filtered, setFiltered] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [sortBy, setSortBy] = useState<'rating' | 'listings' | 'views'>('rating');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await api.businessProfiles.getByCity(cityName);
                const arr = Array.isArray(data) ? data : [];
                setVendors(arr);
                setFiltered(arr);
            } catch {
                /* ignore */
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [cityName]);

    // Apply filter + sort
    useEffect(() => {
        let arr = [...vendors];
        if (query.trim()) {
            arr = arr.filter(v =>
                v.businessName.toLowerCase().includes(query.toLowerCase()) ||
                v.categories?.some((c: string) => c.toLowerCase().includes(query.toLowerCase()))
            );
        }
        arr.sort((a, b) => {
            if (sortBy === 'rating') return (b.avgRating || 0) - (a.avgRating || 0);
            if (sortBy === 'listings') return b.listingCount - a.listingCount;
            return b.totalViews - a.totalViews;
        });
        setFiltered(arr);
    }, [query, sortBy, vendors]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar />

            {/* Hero Banner */}
            <section className="bg-gradient-to-br from-[#0B2244] via-[#0D2E61] to-[#1a3a70] min-h-[50vh] flex items-center px-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/10 rounded-full blur-2xl -ml-24 -mb-24 pointer-events-none" />

                <div className="relative w-full max-w-7xl mx-auto">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center">
                            <MapPin className="w-6 h-6 text-orange-400" />
                        </div>
                        <span className="text-orange-400 text-sm font-black uppercase tracking-widest">Business Profiles</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight mb-4">
                        Business Profiles in
                        <span className="text-orange-400"> {cityName}</span>
                    </h1>
                    <p className="text-white/50 font-medium text-base max-w-lg">
                        Browse all business profiles in {cityName}
                    </p>
                </div>
            </section>

            <main className="flex-grow max-w-7xl mx-auto px-4 py-10 w-full">
                {/* Controls */}
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-slate-400" />
                        <span className="font-black text-slate-900">
                            {loading ? 'Loading…' : `${filtered.length} business${filtered.length !== 1 ? 'es' : ''} found`}
                        </span>
                    </div>

                    <div className="flex gap-3 flex-wrap">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search business or category…"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-slate-400 w-52"
                            />
                        </div>

                        {/* Sort */}
                        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 z-40 relative">
                            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                            <div className="w-36">
                                <SearchableSelect
                                    value={sortBy}
                                    onChange={val => setSortBy(val as any)}
                                    options={[
                                        { label: "Top Rated", value: "rating" },
                                        { label: "Most Listings", value: "listings" },
                                        { label: "Most Views", value: "views" }
                                    ]}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {Array(8).fill(0).map((_, i) => (
                            <div key={i} className="h-80 bg-slate-200 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-24">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <MapPin className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">No businesses found</h3>
                        <p className="text-slate-400 text-sm mb-6">
                            {query ? `No businesses match "${query}" in ${cityName}` : `No approved businesses in ${cityName} yet`}
                        </p>
                        {query && (
                            <button
                                onClick={() => setQuery('')}
                                className="text-orange-500 font-black text-sm hover:text-orange-600 transition-colors"
                            >
                                Clear search
                            </button>
                        )}
                        <div className="mt-6">
                            <Link href="/cities" className="text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors">
                                ← Browse other cities
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {filtered.map(vendor => (
                            <VendorProfileCard key={vendor.id} vendor={vendor} city={cityName} />
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
