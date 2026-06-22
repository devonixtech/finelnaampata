"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, MapPin, Sliders, Star, X, Filter, Navigation, CheckCircle2, Clock, Layers } from 'lucide-react';
import { detectLocationForUi } from '../../lib/location-detect';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import BusinessCard from '../../components/BusinessCard';
import { api } from '../../lib/api';
import { Business } from '../../types/api';
import Link from 'next/link';

function SearchResults() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const query = searchParams.get('q') || '';
    const city = searchParams.get('city') || '';
    const country = searchParams.get('country') || '';
    const categorySlug = searchParams.get('category') || '';
    const minRating = searchParams.get('minRating') || '';
    const radius = searchParams.get('radius') || '';
    const latitude = searchParams.get('latitude') || '';
    const longitude = searchParams.get('longitude') || '';
    const openNow = searchParams.get('openNow') === 'true';
    const verifiedOnly = searchParams.get('verifiedOnly') === 'true';
    const fastResponse = searchParams.get('fastResponse') === 'true';
    const onlineNow = searchParams.get('onlineNow') === 'true';
    const experience = searchParams.get('experience') === 'true';
    const mostContacted = searchParams.get('mostContacted') === 'true';
    const sortBy = searchParams.get('sortBy') || 'relevance';

    const [results, setResults] = useState<Business[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [geoLoading, setGeoLoading] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [searchRes, catsData] = await Promise.all([
                        api.listings.search({
                            query: query,
                            city: city,
                            country: country,
                            categorySlug: categorySlug,
                            minRating: minRating,
                            radius: radius ? Number(radius) : undefined,
                            latitude: latitude ? Number(latitude) : undefined,
                            longitude: longitude ? Number(longitude) : undefined,
                            openNow: openNow || undefined,
                            verifiedOnly: verifiedOnly || undefined,
                            fastResponse: fastResponse || undefined,
                            onlineNow: onlineNow || undefined,
                            experience: experience || undefined,
                            mostContacted: mostContacted || undefined,
                            sortBy: sortBy || undefined,
                            limit: 20
                        }),
                        api.categories.getAll()
                ]);
                setResults(searchRes.data);
                setCategories(Array.isArray(catsData) ? catsData : (catsData as any)?.data || []);

                // Log demand if there's a query or category
                if (query || categorySlug) {
                    api.demand.logSearch({
                        keyword: query || "",
                        city: city || undefined,
                        country: country || undefined,
                        categorySlug: categorySlug || undefined,
                        latitude: latitude ? Number(latitude) : undefined,
                        longitude: longitude ? Number(longitude) : undefined,
                    }).catch(err => console.error('Demand logging failed:', err));
                }
            } catch (err) {
                console.error('Search failed:', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [query, city, country, categorySlug, minRating, radius, latitude, longitude, openNow, verifiedOnly, fastResponse, onlineNow, experience, mostContacted, sortBy]);

    const handleNearMe = async () => {
        setGeoLoading(true);
        try {
            const coords = await detectLocationForUi();
            if (!coords) return;
            const params = new URLSearchParams(searchParams.toString());
            params.set('latitude', String(coords.latitude));
            params.set('longitude', String(coords.longitude));
            if (!params.has('radius')) params.set('radius', '10');
            router.push(`/search?${params.toString()}`);
        } catch (error) {
            console.error('Geolocation error:', error);
        } finally {
            setGeoLoading(false);
        }
    };

    const updateFilter = (key: string, value: string | boolean | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === null || value === false || value === '') {
            params.delete(key);
        } else {
            params.set(key, String(value));
        }
        router.push(`/search?${params.toString()}`);
    };

    return (
        <div className="min-h-screen bg-white flex flex-col font-medium">
            <Navbar />

            {/* Header Section */}
            <div className="bg-slate-900 pt-32 pb-24 relative overflow-hidden">
                {/* Background effects */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 -left-20 w-96 h-96 bg-primary/30 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 -right-20 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]" />
                </div>
                
                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
                        <div className="max-w-3xl">
                            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-8">
                                <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                                <span className="w-4 h-[1px] bg-slate-700" />
                                <span className="text-white">Search Results</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[0.9] mb-4">
                                {sortBy === 'newest' ? (
                                    <>Latest <span className="text-primary italic">Arrivals</span></>
                                ) : city ? (
                                    <>Best in <span className="text-primary italic">{city}</span></>
                                ) : country ? (
                                    <>Explore <span className="text-primary italic">{country}</span></>
                                ) : query ? (
                                    <>Finding <span className="text-primary italic">"{query}"</span></>
                                ) : (
                                    <>Explore <span className="text-primary italic">Locals</span></>
                                )}
                            </h1>
                            <p className="text-slate-400 text-lg font-bold">
                                {results.length} premium results matched your criteria
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-6 bg-white/5 backdrop-blur-xl px-8 py-6 rounded-[32px] border border-white/10 shadow-2xl">
                             <div className="text-right">
                                <div className="text-3xl font-black text-white leading-none mb-1">{results.length}</div>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Live Matches</div>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                                <Search className="w-6 h-6 text-primary" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="flex-grow max-w-7xl mx-auto px-4 w-full py-20">
                <div className="flex flex-col lg:grid lg:grid-cols-12 gap-16 items-start">

                    {/* Filters Sidebar */}
                    <aside className={`lg:col-span-3 w-full space-y-12 sticky top-28`}>
                        <div className="flex items-center justify-between lg:hidden mb-6">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Search Parameters</h3>
                            <button onClick={() => setShowFilters(!showFilters)} className="p-4 bg-slate-50 rounded-2xl">
                                <Filter className="w-5 h-5 text-slate-900" />
                            </button>
                        </div>

                        <div className={`${showFilters ? 'block' : 'hidden lg:block'} space-y-12 animate-in fade-in duration-500`}>
                            {/* Categories */}
                            {categories.length > 0 && (
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                        <Layers className="w-3.5 h-3.5" /> Categories
                                    </h4>
                                    <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                                        {categories
                                            .filter(c => !c.parentId)
                                            .slice(0, 20)
                                            .map(cat => (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => updateFilter('category', categorySlug === cat.slug ? null : cat.slug)}
                                                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all ${categorySlug === cat.slug ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                                                >
                                                    {cat.name}
                                                </button>
                                            ))
                                        }
                                    </div>
                                </div>
                            )}

                            {/* Rating Filter */}
                            <div>
                                <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-6">Performance</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {[4.5, 4, 3, 0].map(star => (
                                        <button
                                            key={star}
                                            onClick={() => updateFilter('minRating', minRating === String(star) ? null : String(star))}
                                            className={`py-3 rounded-xl border transition-all font-black text-[10px] flex items-center justify-center gap-1.5 uppercase tracking-widest ${minRating === String(star) ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-900'}`}
                                        >
                                            {star === 0 ? 'Any' : <>{star}<Star className={`w-3 h-3 ${minRating === String(star) ? 'fill-current' : ''}`} /></>}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Distance Filter */}
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Proximity</h4>
                                    <button 
                                        onClick={handleNearMe}
                                        disabled={geoLoading}
                                        className={`p-2 rounded-xl border transition-all ${latitude ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-blue-600'}`}
                                    >
                                        {geoLoading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Navigation className="w-4 h-4" />}
                                    </button>
                                </div>
                                {latitude ? (
                                    <div className="space-y-4">
                                        <input 
                                            type="range" 
                                            min="1" 
                                            max="50" 
                                            value={radius || 10} 
                                            onChange={(e) => updateFilter('radius', e.target.value)}
                                            className="w-full accent-blue-600"
                                        />
                                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Range</span>
                                            <span className="text-xs font-black text-blue-600">{radius || 10} KM</span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-[10px] text-slate-400 font-bold italic leading-relaxed">Enable geo-location to explore businesses near your current coordinates.</p>
                                )}
                            </div>

                             {/* Advanced Filters Section */}
                            <div className="pt-12 border-t border-slate-50 space-y-8">
                                <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-6">Advanced Filters</h4>
                                
                                <div className="space-y-6">
                                    <label className="flex items-center justify-between cursor-pointer group">
                                        <span className="text-xs font-bold text-slate-400 group-hover:text-slate-900 transition-colors">Open Now</span>
                                        <input 
                                            type="checkbox" 
                                            checked={openNow} 
                                            onChange={(e) => updateFilter('openNow', e.target.checked)}
                                            className="w-4 h-4 rounded-lg border-slate-200 text-blue-600 focus:ring-blue-500/10"
                                        />
                                    </label>

                                    <label className="flex items-center justify-between cursor-pointer group">
                                        <span className="text-xs font-bold text-slate-400 group-hover:text-slate-900 transition-colors">Recommended Only</span>
                                        <input 
                                            type="checkbox" 
                                            checked={verifiedOnly} 
                                            onChange={(e) => updateFilter('verifiedOnly', e.target.checked)}
                                            className="w-4 h-4 rounded-lg border-slate-200 text-blue-600 focus:ring-blue-500/10"
                                        />
                                    </label>

                                    <label className="flex items-center justify-between cursor-pointer group">
                                        <span className="text-xs font-bold text-slate-400 group-hover:text-slate-900 transition-colors">Fast Response</span>
                                        <input 
                                            type="checkbox" 
                                            checked={fastResponse} 
                                            onChange={(e) => updateFilter('fastResponse', e.target.checked)}
                                            className="w-4 h-4 rounded-lg border-slate-200 text-emerald-600 focus:ring-emerald-500/10"
                                        />
                                    </label>

                                    <label className="flex items-center justify-between cursor-pointer group">
                                        <span className="text-xs font-bold text-slate-400 group-hover:text-slate-900 transition-colors">Online Now</span>
                                        <div className="flex items-center gap-3">
                                            {onlineNow && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                                            <input 
                                                type="checkbox" 
                                                checked={onlineNow} 
                                                onChange={(e) => updateFilter('onlineNow', e.target.checked)}
                                                className="w-4 h-4 rounded-lg border-slate-200 text-blue-600 focus:ring-blue-500/10"
                                            />
                                        </div>
                                    </label>

                                    <label className="flex items-center justify-between cursor-pointer group">
                                        <span className="text-xs font-bold text-slate-400 group-hover:text-slate-900 transition-colors">Experienced Listing</span>
                                        <input 
                                            type="checkbox" 
                                            checked={experience} 
                                            onChange={(e) => updateFilter('experience', e.target.checked)}
                                            className="w-4 h-4 rounded-lg border-slate-200 text-blue-600 focus:ring-blue-500/10"
                                        />
                                    </label>

                                    <label className="flex items-center justify-between cursor-pointer group">
                                        <span className="text-xs font-bold text-slate-400 group-hover:text-slate-900 transition-colors">Most Contacted</span>
                                        <input 
                                            type="checkbox" 
                                            checked={mostContacted} 
                                            onChange={(e) => updateFilter('mostContacted', e.target.checked)}
                                            className="w-4 h-4 rounded-lg border-slate-200 text-blue-600 focus:ring-blue-500/10"
                                        />
                                    </label>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => router.push('/search')}
                                className="w-full py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 hover:text-red-500 transition-all bg-slate-50/50 rounded-[20px] border border-slate-100/50"
                            >
                                Reset All Params
                            </button>
                        </div>
                    </aside>

                    {/* Results Area */}
                    <div className="lg:col-span-9 w-full">
                        {/* Active Filter Chips */}
                        {(() => {
                            const chips: { key: string; label: string; value: string }[] = [];
                            if (query) chips.push({ key: 'q', label: `"${query}"`, value: query });
                            if (country) chips.push({ key: 'country', label: country, value: country });
                            if (city) chips.push({ key: 'city', label: city, value: city });
                            if (categorySlug) chips.push({ key: 'category', label: categorySlug, value: categorySlug });
                            if (minRating && minRating !== '0') chips.push({ key: 'minRating', label: `${minRating}+ Stars`, value: minRating });
                            if (sortBy && sortBy !== 'relevance') chips.push({ key: 'sortBy', label: sortBy.charAt(0).toUpperCase() + sortBy.slice(1), value: sortBy });
                            if (openNow) chips.push({ key: 'openNow', label: 'Open Now', value: 'true' });
                            if (verifiedOnly) chips.push({ key: 'verifiedOnly', label: 'Verified', value: 'true' });
                            if (fastResponse) chips.push({ key: 'fastResponse', label: 'Fast Response', value: 'true' });
                            if (onlineNow) chips.push({ key: 'onlineNow', label: 'Online', value: 'true' });
                            if (radius && latitude) chips.push({ key: 'radius', label: `${radius}km radius`, value: radius });

                            if (chips.length === 0) return null;

                            return (
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {chips.map(chip => (
                                        <button
                                            key={chip.key}
                                            onClick={() => updateFilter(chip.key, null)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-xs font-bold text-slate-600 transition-colors"
                                        >
                                            {chip.label}
                                            <X className="w-3 h-3" />
                                        </button>
                                    ))}
                                    {chips.length > 1 && (
                                        <button
                                            onClick={() => router.push('/search')}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-full text-xs font-bold text-red-500 transition-colors"
                                        >
                                            Clear All
                                        </button>
                                    )}
                                </div>
                            );
                        })()}

                        {/* Sort Bar */}
                        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mr-2 shrink-0">Sort:</span>
                            {[
                                { label: 'Recommended', value: 'relevance' },
                                { label: 'Nearest', value: 'distance' },
                                { label: 'Top Rated', value: 'rating' },
                                { label: 'Most Reviewed', value: 'reviews' },
                                { label: 'Most Contacted', value: 'contacted' },
                            ].map(sort => (
                                <button
                                    key={sort.value}
                                    onClick={() => updateFilter('sortBy', sortBy === sort.value ? null : sort.value)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
                                        sortBy === sort.value
                                            ? 'bg-slate-900 text-white'
                                            : 'bg-white border border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-900'
                                    }`}
                                >
                                    {sort.label}
                                </button>
                            ))}
                        </div>

                        {loading ? (
                            <div className="grid sm:grid-cols-2 gap-x-10 gap-y-16">
                                {Array(6).fill(0).map((_, i) => (
                                    <div key={i} className="space-y-6">
                                        <div className="aspect-[4/3] bg-slate-50 rounded-[20px] animate-pulse border border-slate-100" />
                                        <div className="space-y-3">
                                            <div className="h-4 bg-slate-50 w-1/3 rounded animate-pulse" />
                                            <div className="h-8 bg-slate-50 w-2/3 rounded animate-pulse" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : results.length > 0 ? (
                            <div className="grid sm:grid-cols-2 gap-x-10 gap-y-16">
                                {results.map(biz => (
                                    <BusinessCard 
                                        key={biz.id} 
                                        business={biz} 
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="py-40 text-center flex flex-col items-center">
                                <Search className="w-16 h-16 text-slate-100 mb-8" />
                                <h3 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">Zero Matches.</h3>
                                <p className="text-slate-400 font-bold mb-10 max-w-sm">We couldn't find any listings matching your specific parameters. Adjust your filters or try a broader search.</p>
                                <button 
                                    onClick={() => router.push('/search')}
                                    className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all"
                                >
                                    Start Fresh
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

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-12 h-12 border-t-2 border-blue-600 rounded-full animate-spin" />
            </div>
        }>
            <SearchResults />
        </Suspense>
    );
}

