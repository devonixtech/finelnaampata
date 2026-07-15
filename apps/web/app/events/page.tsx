'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
    Search, 
    MapPin, 
    Navigation,
    ArrowRight,
    Loader2,
    Calendar,
    ChevronRight,
    Clock,
    Sparkles,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import OfferCard from '../../components/OfferCard';
import { api } from '../../lib/api';
import { City } from '../../types/api';
import Link from 'next/link';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { motion } from 'framer-motion';
import { detectLocationForUi, sortAndDedupeCities } from '../../lib/location-detect';

const EventsContent = () => {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [cities, setCities] = useState<City[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [query, setQuery] = useState(searchParams.get('query') || '');
    const [city, setCity] = useState(searchParams.get('city') || '');
    const [radius, setRadius] = useState(searchParams.get('radius') || '10');
    const [lat, setLat] = useState(searchParams.get('latitude') || '');
    const [lng, setLng] = useState(searchParams.get('longitude') || '');
    
    const [isLocating, setIsLocating] = useState(false);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const citiesData = await api.cities.getAll();
                setCities(sortAndDedupeCities(citiesData || []));
            } catch (err) {
                console.error('Failed to load cities:', err);
            }
        };
        loadInitialData();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const params = {
                query,
                city,
                radius: lat && lng ? radius : undefined,
                latitude: lat || undefined,
                longitude: lng || undefined,
                page,
                limit: 12,
            };

            const result = await api.events.search(params);
            const items = (result?.data || []).map((item: any) => ({ ...item, type: 'event' as const }));
            setEvents(items);
            setTotal(result?.meta?.total || items.length);
            setTotalPages(result?.meta?.totalPages || 1);
        } catch (error) {
            console.error('Failed to fetch events:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        fetchEvents();
    }, [page, city, lat, lng]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchEvents();
        
        const params = new URLSearchParams();
        if (query) params.set('query', query);
        if (city) params.set('city', city);
        if (lat) params.set('latitude', lat);
        if (lng) params.set('longitude', lng);
        if (radius) params.set('radius', radius);
        
        router.push(`/events?${params.toString()}`, { scroll: false });
    };

    const handleGetLocation = async () => {
        setIsLocating(true);
        try {
            const coords = await detectLocationForUi();
            if (!coords) return;
            setLat(coords.latitude.toString());
            setLng(coords.longitude.toString());
        } catch (error) {
            console.error('Geolocation error:', error);
        } finally {
            setIsLocating(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <div className="bg-white border-b border-slate-50 pt-10 pb-12 lg:pt-10 lg:pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-300 mb-10">
                        <Link href="/" className="hover:text-orange-500">Home</Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-slate-900">Events</span>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
                        <div className="max-w-3xl">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 flex items-center gap-2">
                                    <Clock className="w-3 h-3" /> Upcoming Events
                                </div>
                            </div>
                            <h1 className="text-5xl lg:text-7xl font-black text-slate-900 mb-8 tracking-tighter leading-[0.9]">
                                Local Events <br />
                                <span className="text-orange-500">Near You.</span>
                            </h1>
                            <p className="text-xl text-slate-400 font-bold leading-relaxed max-w-xl">
                                Find and explore exciting events happening in your area.
                            </p>
                        </div>

                        <div className="flex items-center gap-8 bg-[#F8FAFC] p-8 rounded-[20px] border border-slate-100/50">
                            <div>
                                <div className="text-4xl font-black text-slate-900 leading-none mb-1">{total}</div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Events Found</div>
                            </div>
                            <div className="w-px h-12 bg-slate-200" />
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm">
                                <Calendar className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
                <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-3 p-3 bg-white rounded-[24px] shadow-slate-200/50 border border-slate-100">
                    <div className="flex-1 relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-orange-500 transition-colors" />
                        <input 
                            type="text" 
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search events..."
                            className="w-full pl-12 pr-4 py-4 bg-[#F8FAFC] rounded-2xl text-xs font-bold focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all placeholder:text-slate-300"
                        />
                    </div>

                    <div className="w-full lg:w-48 relative z-50">
                        <SearchableSelect
                            value={city}
                            onChange={val => setCity(val)}
                            options={[
                                { label: "All Pakistan", value: "" },
                                ...cities.map(c => ({ label: c.name, value: c.name }))
                            ]}
                            placeholder="All Pakistan"
                        />
                    </div>

                    <button 
                        type="submit"
                        className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-orange-500 transition-all shadow-xl shadow-slate-900/10 active:scale-95"
                    >
                        Filter Results
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </form>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="flex flex-col lg:grid lg:grid-cols-12 gap-16">
                    <aside className="lg:col-span-3">
                        <div className="sticky top-28 space-y-12">
                            <div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 mb-8 flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5" /> Refine Events
                                </h3>

                                <div className="space-y-10">
                                    <div className="space-y-4">
                                        <label className="text-xs font-black text-slate-900 tracking-tight">Geo Radius</label>
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={handleGetLocation}
                                                disabled={isLocating}
                                                className={`flex-1 p-4 rounded-2xl border flex items-center justify-center gap-2 transition-all ${lat ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-[#F8FAFC] border-slate-100 text-slate-400 hover:text-slate-900'}`}
                                            >
                                                {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                                                <span className="text-[9px] font-black uppercase tracking-tight">{lat ? 'Located' : 'Near Me'}</span>
                                            </button>
                                            {lat && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => { setLat(''); setLng(''); }}
                                                    className="p-4 bg-slate-50 border border-slate-100 text-slate-400 rounded-2xl hover:text-red-500 transition-colors"
                                                >
                                                    <ArrowRight className="w-4 h-4 rotate-180" />
                                                </button>
                                            )}
                                        </div>
                                        {lat && (
                                            <div className="mt-4">
                                                <div className="flex justify-between mb-4">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scope: {radius}km</span>
                                                </div>
                                                <input 
                                                    type="range" 
                                                    min="1" 
                                                    max="100" 
                                                    value={radius}
                                                    onChange={(e) => setRadius(e.target.value)}
                                                    className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setQuery('');
                                            setCity('');
                                            setLat('');
                                            setLng('');
                                            setRadius('10');
                                            router.push('/events', { scroll: false });
                                        }}
                                        className="w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 hover:text-red-500 transition-colors"
                                    >
                                        Reset Parameters
                                    </button>
                                </div>
                            </div>
                        </div>
                    </aside>

                    <div className="lg:col-span-9">
                        <div className="flex items-center gap-4 mb-16">
                            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-300">
                                {total} Upcoming Events
                            </h2>
                            <div className="h-px w-10 bg-slate-100" />
                        </div>

                        {loading ? (
                            <div className="py-40 flex flex-col items-center justify-center gap-6">
                                <div className="w-12 h-12 border-t-2 border-blue-500 rounded-full animate-spin" />
                                <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Discovering Events</p>
                            </div>
                        ) : events.length > 0 ? (
                            <>
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16">
                                    {events.map((event) => (
                                        <motion.div
                                            key={event.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            <OfferCard 
                                                offer={event} 
                                                onEnquire={() => router.push(`/offers-events/${event.id}`)}
                                            />
                                        </motion.div>
                                    ))}
                                </div>

                                {totalPages > 1 && (
                                    <div className="mt-24 flex justify-center items-center gap-4">
                                        <button
                                            disabled={page === 1}
                                            onClick={() => setPage(p => p - 1)}
                                            className="w-12 h-12 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-all"
                                        >
                                            <ArrowRight className="w-4 h-4 rotate-180" />
                                        </button>
                                        <div className="flex items-center gap-2">
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                let p = i + 1;
                                                if (totalPages > 5 && page > 3) p = page - 3 + i + 1;
                                                if (p > totalPages) return null;
                                                return (
                                                    <button
                                                        key={p}
                                                        onClick={() => setPage(p)}
                                                        className={`w-12 h-12 rounded-2xl font-black text-xs transition-all ${page === p ? 'bg-slate-900 text-white shadow-xl' : 'hover:bg-slate-50 text-slate-400'}`}
                                                    >
                                                        {p}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <button
                                            disabled={page === totalPages}
                                            onClick={() => setPage(p => p + 1)}
                                            className="w-12 h-12 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-all"
                                        >
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="py-40 text-center">
                                <h3 className="text-4xl font-black text-slate-900 mb-6 tracking-tighter">No Events Found.</h3>
                                <p className="text-slate-400 font-bold mb-10">No events currently match your criteria. Check back later for new events.</p>
                                <button 
                                    onClick={() => {
                                        setQuery('');
                                        setCity('');
                                        setLat('');
                                        setLng('');
                                        setRadius('10');
                                        router.push('/events', { scroll: false });
                                    }}
                                    className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-500 transition-all active:scale-95"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

const EventsPage = () => {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center bg-white">
                <div className="w-12 h-12 border-t-2 border-blue-500 rounded-full animate-spin mb-6" />
                <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Loading Events</p>
            </div>
        }>
            <EventsContent />
        </Suspense>
    );
};

export default EventsPage;
