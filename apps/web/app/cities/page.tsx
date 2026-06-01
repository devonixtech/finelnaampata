"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Search, ArrowRight, Building2 } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { api } from '../../lib/api';
import { City } from '../../types/api';

// Curated gradient palette per letter/index
const gradients = [
    'from-blue-600 to-indigo-700',
    'from-orange-500 to-rose-600',
    'from-emerald-500 to-teal-700',
    'from-purple-600 to-violet-700',
    'from-amber-500 to-orange-600',
    'from-cyan-500 to-blue-600',
    'from-pink-500 to-rose-600',
    'from-green-500 to-emerald-700',
    'from-red-500 to-orange-600',
    'from-slate-600 to-slate-800',
];



export default function CitiesPage() {
    const [cities, setCities] = useState<City[]>([]);
    const [filtered, setFiltered] = useState<City[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [countries, setCountries] = useState<string[]>([]); // New state for unique countries
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null); // New state for selected country

    useEffect(() => {
        const load = async () => {
            try {
                const data = await api.cities.getAll();
                const arr = Array.isArray(data) ? data : (data as any)?.data ?? [];
                setCities(arr);
                setFiltered(arr);

                // Extract unique countries and sort them
                const uniqueCountries = Array.from(
                    new Set((arr as City[]).map((c: City) => c.country).filter(Boolean) as string[])
                ).sort((a, b) => a.localeCompare(b));
                setCountries(uniqueCountries);
            } catch {
                /* ignore */
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    useEffect(() => {
        let currentFiltered = cities;

        // Apply country filter first
        if (selectedCountry) {
            currentFiltered = currentFiltered.filter(c => c.country === selectedCountry);
        }

        // Then apply text search filter
        if (query.trim()) {
            currentFiltered = currentFiltered.filter(c =>
                c.name.toLowerCase().includes(query.toLowerCase()) ||
                (c.state || '').toLowerCase().includes(query.toLowerCase()) ||
                (c.country || '').toLowerCase().includes(query.toLowerCase())
            );
        }

        setFiltered(currentFiltered);
    }, [query, cities, selectedCountry]); // Add selectedCountry to dependencies

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar />

            {/* Hero Banner */}
            <section className="relative bg-gradient-to-br from-[#0B2244] via-[#0D2E61] to-[#1a3a70] min-h-[50vh] flex items-center px-4 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-400/10 rounded-full blur-2xl -ml-28 -mb-28 pointer-events-none" />
                <div className="relative max-w-4xl mx-auto text-center">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full text-orange-300 text-xs font-black uppercase tracking-widest mb-4">
                        <MapPin className="w-3 h-3" /> Browse by Location
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                        Discover Businesses<br />
                        <span className="text-orange-400">In Your City</span>
                    </h1>
                    <p className="text-white/60 font-medium text-base mb-8">
                        Click on any city to explore local businesses
                    </p>

                    {/* Search bar */}
                    <div className="relative max-w-md mx-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search city or province…"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl font-semibold text-slate-900 text-sm  focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-slate-400"
                        />
                    </div>

                    {/* Country filter pills */}
                    {!loading && countries.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-2 mt-5">
                            <button
                                onClick={() => setSelectedCountry('')}
                                className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wide border transition-all duration-200 ${!selectedCountry
                                    ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/30'
                                    : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
                                    }`}
                            >
                                🌍 All Countries
                            </button>
                            {countries.map(country => (
                                <button
                                    key={country}
                                    onClick={() => setSelectedCountry(selectedCountry === country ? '' : country)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wide border transition-all duration-200 ${selectedCountry === country
                                        ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/30'
                                        : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
                                        }`}
                                >
                                    {country}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <main className="flex-grow max-w-7xl mx-auto px-4 py-12 w-full">
                {/* Count */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">
                            {loading ? 'Loading cities…' : `${filtered.length} ${filtered.length === 1 ? 'City' : 'Cities'}`}
                        </h2>
                        {selectedCountry && (
                            <p className="text-sm text-orange-500 font-bold mt-0.5">Filtered by: {selectedCountry}</p>
                        )}
                    </div>
                    {(query || selectedCountry) && (
                        <button
                            onClick={() => { setQuery(''); setSelectedCountry(''); }}
                            className="text-xs font-black text-orange-500 hover:text-orange-600 transition-colors"
                        >
                            Clear filters
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {Array(15).fill(0).map((_, i) => (
                            <div key={i} className="h-36 bg-slate-200 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20">
                        <MapPin className="w-12 h-12 mx-auto text-slate-200 mb-4" />
                        <h3 className="text-slate-700 font-black text-lg mb-1">No cities found</h3>
                        <p className="text-slate-400 text-sm">Try a different search term</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filtered.map((city, idx) => (
                            <Link
                                key={city.id}
                                href={`/cities/${encodeURIComponent(city.name.toLowerCase())}`}
                                className="group relative rounded-2xl overflow-hidden shadow-sm hover: transition-all duration-300 hover:-translate-y-1"
                            >
                                {/* Gradient background */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${gradients[idx % gradients.length]} opacity-90 group-hover:opacity-100 transition-opacity`} />

                                {/* Content */}
                                <div className="relative p-5 h-36 flex flex-col justify-end">
                                    <div>
                                        <h3 className="font-black text-white text-base leading-tight">{city.name}</h3>
                                        {(city.state || city.country) && (
                                            <p className="text-white/70 text-[10px] font-bold mt-0.5 uppercase tracking-wider">
                                                {[city.state, city.country].filter(Boolean).join(', ')}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Hover overlay arrow */}
                                <div className="absolute bottom-4 right-4 w-7 h-7 bg-white/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
