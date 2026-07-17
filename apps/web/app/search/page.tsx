"use client";

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, MapPin, Star, X, Filter, Navigation, LayoutGrid, List, ChevronDown } from 'lucide-react';
import { detectLocationForUi } from '../../lib/location-detect';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import BusinessCard from '../../components/BusinessCard';
import CitySearchSelect from '../../components/CitySearchSelect';
import { api } from '../../lib/api';
import { Business, City } from '../../types/api';
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
    const [cities, setCities] = useState<City[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [geoLoading, setGeoLoading] = useState(false);
    
    // View mode (grid or list)
    const [viewMode, setViewMode] = useState<'grid'|'list'>('grid');
    // Local search states for the header search bar
    const [searchLocation, setSearchLocation] = useState(city || '');
    const [searchQuery, setSearchQuery] = useState(query || '');
    const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
    const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        api.cities.getAll().then(setCities).catch(console.error);
    }, []);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setIsSuggestionsOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        if (!searchQuery.trim() || searchQuery.length < 2) {
            setSearchSuggestions([]);
            return;
        }
        const timer = setTimeout(() => {
            api.listings.getSuggestions(searchQuery)
                .then((suggestions) => setSearchSuggestions(suggestions))
                .catch(() => setSearchSuggestions([]));
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const searchRes = await api.listings.search({
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
                });
                setResults(searchRes.data);

                // Log demand if there's a query or category
                if (query || categorySlug) {
                    api.demand.logSearch({
                        keyword: query || "",
                        city: city || undefined,
                        country: country || undefined,
                        categorySlug: categorySlug || undefined,
                    });
                }
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [query, city, country, categorySlug, minRating, radius, latitude, longitude, openNow, verifiedOnly, fastResponse, onlineNow, experience, mostContacted, sortBy]);

    const updateFilter = (key: string, value: string | boolean | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === null || value === false) {
            params.delete(key);
        } else {
            params.set(key, String(value));
        }
        router.push(`/search?${params.toString()}`);
    };

    const handleNearMe = async () => {
        setGeoLoading(true);
        try {
            const loc = await detectLocationForUi();
            if (loc) {
                const params = new URLSearchParams(searchParams.toString());
                params.set('latitude', String(loc.lat));
                params.set('longitude', String(loc.lng));
                router.push(`/search?${params.toString()}`);
            }
        } finally {
            setGeoLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-medium">
            <Navbar />

            {/* Header Section */}
            <div className="bg-[#0e1b33] pt-12 pb-12 relative">
                <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full border-[0.5px] border-white/20 [mask-image:radial-gradient(circle_at_center,black,transparent_80%)]" style={{ backgroundSize: '40px 40px', backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)' }} />
                </div>
                
                <div className="max-w-[1600px] mx-auto px-4 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-12">
                        
                        <div className="max-w-xl flex-1">
                            <h1 className="text-4xl md:text-[40px] font-bold text-white tracking-tight leading-[1.1] mb-2">
                                {city ? (
                                    <>Explore <span className="text-[#8ab4f8] italic font-medium">Locals</span> in {city}</>
                                ) : country ? (
                                    <>Explore <span className="text-[#8ab4f8] italic font-medium">{country}</span></>
                                ) : query ? (
                                    <>Finding <span className="text-[#8ab4f8] italic font-medium">"{query}"</span></>
                                ) : (
                                    <>Explore <span className="text-[#8ab4f8] italic font-medium">Locals</span></>
                                )}
                            </h1>
                            <p className="text-slate-400 text-[15px]">
                                Discover and connect with the best local businesses around you.
                            </p>
                        </div>
                        
                        <div className="flex-1 w-full max-w-xl">
                             <div ref={searchRef} className="bg-white rounded-xl shadow-2xl flex items-center p-2 mb-3 relative">
                                <div className="flex items-center px-4 border-r border-slate-200 flex-1 h-10 w-full min-w-[150px]">
                                    <CitySearchSelect
                                        cities={cities}
                                        value={searchLocation}
                                        onChange={setSearchLocation}
                                        placeholder="City, State"
                                        minimal
                                    />
                                </div>
                                <div className="flex items-center px-4 flex-1 h-10 relative group">
                                    <input 
                                        type="text"
                                        placeholder="What are you looking for?"
                                        value={searchQuery}
                                        onChange={e => {
                                            setSearchQuery(e.target.value);
                                            setIsSuggestionsOpen(true);
                                        }}
                                        onFocus={() => setIsSuggestionsOpen(true)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                setIsSuggestionsOpen(false);
                                                updateFilter('q', searchQuery);
                                                updateFilter('city', searchLocation);
                                            }
                                        }}
                                        className="bg-transparent border-none outline-none text-sm font-medium text-slate-700 w-full placeholder:font-normal"
                                    />
                                    {isSuggestionsOpen && searchSuggestions.length > 0 && (
                                        <div className="absolute top-[calc(100%+16px)] left-0 right-0 z-[100] mt-1 bg-white rounded-xl border border-slate-100 shadow-xl overflow-hidden min-w-[250px]">
                                            {searchSuggestions.map((suggestion, idx) => (
                                                <button
                                                    key={idx}
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        setSearchQuery(suggestion);
                                                        setIsSuggestionsOpen(false);
                                                        updateFilter('q', suggestion);
                                                        updateFilter('city', searchLocation);
                                                    }}
                                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center gap-3 text-sm font-medium text-slate-700"
                                                >
                                                    <Search className="w-4 h-4 text-slate-300 shrink-0" />
                                                    <span className="truncate">{suggestion}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button 
                                    onClick={() => {
                                        setIsSuggestionsOpen(false);
                                        updateFilter('q', searchQuery);
                                        updateFilter('city', searchLocation);
                                    }}
                                    className="w-10 h-10 bg-[#1a73e8] hover:bg-blue-700 rounded-lg flex items-center justify-center shrink-0 shadow-md transition-colors"
                                >
                                    <Search className="w-4 h-4 text-white" />
                                </button>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs text-slate-400 mr-1">Popular Searches:</span>
                                {['Restaurants', 'Salons', 'Gyms', 'Clinics', 'Cafes'].map(t => (
                                    <button 
                                        key={t} 
                                        onClick={() => {
                                            setSearchQuery(t);
                                            updateFilter('q', t);
                                        }}
                                        className="px-3 py-1 bg-white/5 border border-white/10 hover:bg-white/10 rounded-full text-xs font-medium text-white transition-colors"
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="flex-grow max-w-[1600px] mx-auto px-4 sm:px-6 w-full py-12">
                <div className="flex flex-col lg:grid lg:grid-cols-12 gap-10 items-start">

                    {/* Filters Sidebar */}
                    <aside className={`lg:col-span-3 xl:col-span-2 w-full sticky top-28 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 lg:max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar space-y-8`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-slate-900">Filters</h3>
                            <button 
                                onClick={() => router.push('/search')}
                                className="text-sm font-bold text-blue-600 hover:text-blue-700 transition"
                            >
                                Clear All
                            </button>
                        </div>

                        <div className={`${showFilters ? 'block' : 'hidden lg:block'} space-y-8 animate-in fade-in duration-500`}>
                            
                            {/* Categories Filter */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                                    <LayoutGrid className="w-4 h-4 text-slate-400" />
                                    Categories
                                </h4>
                                <div className="space-y-3">
                                    {[
                                        { id: 'restaurants', label: 'Restaurants', count: 32 },
                                        { id: 'beauty-wellness', label: 'Beauty & Wellness', count: 18 },
                                        { id: 'health-medical', label: 'Health & Medical', count: 15 },
                                        { id: 'education', label: 'Education', count: 12 },
                                        { id: 'automotive', label: 'Automotive', count: 9 },
                                    ].map(cat => (
                                        <label key={cat.id} className="flex items-center justify-between cursor-pointer group">
                                            <div className="flex items-center gap-3">
                                                <input 
                                                    type="checkbox"
                                                    checked={categorySlug === cat.id}
                                                    onChange={(e) => updateFilter('category', e.target.checked ? cat.id : null)}
                                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                                                />
                                                <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition">{cat.label}</span>
                                            </div>
                                            <span className="text-xs text-slate-400 font-medium">{cat.count}</span>
                                        </label>
                                    ))}
                                </div>
                                <button className="text-xs font-bold text-blue-600 mt-4 hover:underline">
                                    View More
                                </button>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Rating Filter */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                                    <Star className="w-4 h-4 text-slate-400" />
                                    Rating
                                </h4>
                                <div className="space-y-3">
                                    {[
                                        { value: '4.0', label: '4.0 & above', count: 45 },
                                        { value: '3.0', label: '3.0 & above', count: 78 },
                                        { value: '2.0', label: '2.0 & above', count: 102 },
                                        { value: '0', label: 'Any Rating', count: 120 },
                                    ].map(r => (
                                        <label key={r.value} className="flex items-center justify-between cursor-pointer group">
                                            <div className="flex items-center gap-3">
                                                <div className="relative flex items-center justify-center">
                                                    <input 
                                                        type="radio"
                                                        name="rating"
                                                        checked={minRating === r.value || (r.value === '0' && !minRating)}
                                                        onChange={() => updateFilter('minRating', r.value === '0' ? null : r.value)}
                                                        className="w-4 h-4 border-slate-300 text-blue-600 focus:ring-blue-500/20"
                                                    />
                                                </div>
                                                <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition">{r.label}</span>
                                            </div>
                                            <span className="text-xs text-slate-400 font-medium">{r.count}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            
                            <hr className="border-slate-100" />

                            {/* Distance Filter */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Navigation className="w-4 h-4 text-slate-400" />
                                        Distance
                                    </div>
                                    <button onClick={handleNearMe} disabled={geoLoading} className={`text-blue-600 ${geoLoading ? 'animate-pulse' : ''}`}>
                                        <MapPin className="w-4 h-4" />
                                    </button>
                                </h4>
                                <div className="space-y-3">
                                    {[
                                        { value: '1', label: 'Within 1 km', count: 25 },
                                        { value: '5', label: 'Within 5 km', count: 68 },
                                        { value: '10', label: 'Within 10 km', count: 96 },
                                        { value: '0', label: 'Any Distance', count: 120 },
                                    ].map(d => (
                                        <label key={d.value} className="flex items-center justify-between cursor-pointer group">
                                            <div className="flex items-center gap-3">
                                                <input 
                                                    type="radio"
                                                    name="distance"
                                                    checked={radius === d.value || (d.value === '0' && !radius)}
                                                    onChange={() => updateFilter('radius', d.value === '0' ? null : d.value)}
                                                    className="w-4 h-4 border-slate-300 text-blue-600 focus:ring-blue-500/20"
                                                />
                                                <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition">{d.label}</span>
                                            </div>
                                            <span className="text-xs text-slate-400 font-medium">{d.count}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => router.push('/search')}
                                className="w-full py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition rounded-xl shadow-md"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </aside>

                    {/* Results Area */}
                    <div className="lg:col-span-9 xl:col-span-10 w-full">
                        
                        {/* Results Header (Count & Sort) */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <h2 className="text-base font-medium text-slate-700">
                                <span className="font-bold text-blue-600">{results.length}</span> Results found
                            </h2>
                            
                            <div className="flex items-center gap-3">
                                <div className="flex items-center">
                                    <span className="text-sm font-medium text-slate-700 mr-2 shrink-0">Sort by:</span>
                                    <select 
                                        value={sortBy} 
                                        onChange={(e) => updateFilter('sortBy', e.target.value)}
                                        className="bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg focus:ring-blue-500 focus:border-blue-500 block py-2 px-3 pr-8 outline-none cursor-pointer appearance-none"
                                        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.2em 1.2em' }}
                                    >
                                        <option value="relevance">Recommended</option>
                                        <option value="distance">Nearest</option>
                                        <option value="rating">Top Rated</option>
                                        <option value="reviews">Most Reviewed</option>
                                    </select>
                                </div>
                                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden h-[38px] bg-white">
                                    <button 
                                        onClick={() => setViewMode('grid')}
                                        className={`w-10 h-full flex items-center justify-center transition ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                                    >
                                        <LayoutGrid className="w-4 h-4" />
                                    </button>
                                    <div className="w-[1px] h-full bg-slate-200" />
                                    <button 
                                        onClick={() => setViewMode('list')}
                                        className={`w-10 h-full flex items-center justify-center transition ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                                    >
                                        <List className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Active Filter Chips */}
                        {(() => {
                            const chips: { key: string; label: string; value: string }[] = [];
                            if (query) chips.push({ key: 'q', label: `"${query}"`, value: query });
                            if (country) chips.push({ key: 'country', label: country, value: country });
                            if (city) chips.push({ key: 'city', label: city, value: city });
                            if (categorySlug) chips.push({ key: 'category', label: categorySlug, value: categorySlug });
                            if (minRating && minRating !== '0') chips.push({ key: 'minRating', label: `${minRating}+ Stars`, value: minRating });
                            if (openNow) chips.push({ key: 'openNow', label: 'Open Now', value: 'true' });
                            if (radius && latitude) chips.push({ key: 'radius', label: `${radius}km radius`, value: radius });

                            if (chips.length === 0) return null;

                            return (
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {chips.map(chip => (
                                        <button
                                            key={chip.key}
                                            onClick={() => updateFilter(chip.key, null)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-200/50 hover:bg-slate-200 rounded-full text-xs font-bold text-slate-700 transition-colors"
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

                        {loading ? (
                            <div className={viewMode === 'grid' ? "grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6" : "flex flex-col gap-6"}>
                                {Array(6).fill(0).map((_, i) => (
                                    <div key={i} className="space-y-4">
                                        <div className="aspect-[16/10] bg-slate-100 rounded-[24px] animate-pulse" />
                                        <div className="space-y-2">
                                            <div className="h-4 bg-slate-100 w-1/3 rounded animate-pulse" />
                                            <div className="h-6 bg-slate-100 w-2/3 rounded animate-pulse" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : results.length > 0 ? (
                            <div className={viewMode === 'grid' ? "grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6" : "flex flex-col gap-6"}>
                                {results.map(biz => (
                                    <div key={biz.id} className={viewMode === 'list' ? 'max-w-2xl' : ''}>
                                        <BusinessCard business={biz} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-32 text-center flex flex-col items-center">
                                <Search className="w-16 h-16 text-slate-200 mb-6" />
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">0 Results found</h3>
                                <p className="text-slate-500 font-medium mb-8 max-w-sm">We couldn't find any listings matching your specific parameters. Adjust your filters or try a broader search.</p>
                                <button 
                                    onClick={() => router.push('/search')}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 hover:shadow-lg hover:-translate-y-0.5"
                                >
                                    Clear all filters
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
