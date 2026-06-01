"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Star, Mail, Phone, MapPin,
    Calendar, Building2, Globe, ArrowLeft,
    TrendingUp, Award, Clock, Search, Filter,
    Tag, Gift, Ticket, ChevronRight
} from 'lucide-react';
import { api, getImageUrl } from '../../../lib/api';
import Navbar from '../../../components/Navbar';
import VendorAvatar from '../../../components/VendorAvatar';
import ChatTrigger from '../../../components/chat/ChatTrigger';
import Footer from '../../../components/Footer';

interface VendorProfile {
    id: string;
    slug: string;
    businessName: string;
    vendorName: string;
    businessEmail?: string;
    businessPhone?: string;
    businessAddress?: string;
    isVerified: boolean;
    socialLinks: { platform: string; url: string; }[];
    avatarUrl: string | null;
    bio?: string;
    listingCount: number;
    avgRating: number;
    totalViews: number;
    categories: string[];
    createdAt?: string;
    listings: any[];
    offers?: any[];
    events?: any[];
}

export default function VendorProfileClient({ slugOrId, initialData }: { slugOrId: string, initialData?: any }) {
    const router = useRouter();
    const [vendor, setVendor] = useState<VendorProfile | null>(initialData || null);
    const [loading, setLoading] = useState(!initialData);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            let actualSlug = slugOrId;

            // Handle SPA fallback where the page is served by a 'template' HTML file or data is missing
            if (typeof window !== 'undefined') {
                const pathParts = window.location.pathname.split('/').filter(Boolean);
                
                // Check for originalSlug in query params (passed by NotFound redirect)
                const urlParams = new URLSearchParams(window.location.search);
                const querySlug = urlParams.get('originalSlug');

                // URL structure: /businesses/slug/, /vendors/slug/, etc.
                if ((pathParts[0] === 'businesses' || pathParts[0] === 'vendors') && pathParts[1] && pathParts[1] !== 'template' && pathParts[1] !== 'default') {
                    if (!vendor || actualSlug !== pathParts[1]) {
                        actualSlug = pathParts[1];
                        console.log('[VendorProfile] Route detected from URL:', actualSlug);
                    }
                } else if (querySlug) {
                    actualSlug = querySlug;
                    console.log('[VendorProfile] Route detected from query param:', actualSlug);
                }
            }

            try {
                let data = vendor;

                // If the slug from the URL is different from the currently loaded vendor, force a reload
                if (data && data.slug !== actualSlug && data.id !== actualSlug) {
                    console.log('[VendorProfile] Slug mismatch, forcing reload for:', actualSlug);
                    data = null;
                }

                if (initialData && (initialData.slug === actualSlug || initialData.id === actualSlug)) {
                    console.log('[VendorProfile] Using initialData from SSR');
                    setVendor(initialData);
                    setLoading(false);
                    return;
                }

                if (data) {
                    setLoading(false);
                    return;
                }

                const profileData = await api.businessProfiles.getPublicProfile(actualSlug);
                
                // Redirection Logic for SEO (301-like client-side redirect)
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
                if (isUuid && profileData.slug && profileData.slug !== slugOrId) {
                    console.log(`[VendorProfile] Legacy ID detected. Redirecting to SEO slug: ${profileData.slug}`);
                    router.replace(`/businesses/${profileData.slug}`);
                    return;
                }

                setVendor(profileData);
            } catch (err: any) {
                console.error('[VendorProfile] Failed to load profile:', err);
                setError(err.message || 'Failed to load business profile');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [slugOrId, router]);

    const filteredListings = React.useMemo(() => {
        if (!vendor) return [];
        return vendor.listings.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = !activeCategory || item.categoryName === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [vendor, searchTerm, activeCategory]);

    const activeOffers = React.useMemo(() => {
        if (!vendor?.offers) return [];
        const now = new Date();
        return vendor.offers.filter(offer => {
            const expiry = offer.expiryDate ? new Date(offer.expiryDate) : null;
            return !expiry || expiry > now;
        });
    }, [vendor?.offers]);

    const activeEvents = React.useMemo(() => {
        if (!vendor?.events) return [];
        const now = new Date();
        return vendor.events.filter(event => {
            const end = event.endDate ? new Date(event.endDate) : null;
            return !end || end > now;
        });
    }, [vendor?.events]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="flex flex-col items-center justify-center h-[60vh]">
                    <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-slate-400 font-bold animate-pulse">Loading Business Profile...</p>
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !vendor) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="max-w-xl mx-auto mt-20 p-8 bg-white rounded-3xl border border-slate-100 text-center shadow-sm">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Building2 className="w-10 h-10 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 mb-2">Business Profile Not Found</h1>
                    <p className="text-slate-500 mb-8">{error || 'We couldn\'t find the business profile you were looking for.'}</p>
                    <Link href="/search" className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all">
                        <ArrowLeft className="w-5 h-5" /> Back to Search
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    const avatar = vendor.avatarUrl ? getImageUrl(vendor.avatarUrl) : null;
    const memberSince = vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently';

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-50 selection:text-indigo-600">
            <Navbar />

            {/* ── Minimalist Header Area ── */}
            <div className="pt-16 pb-12 border-b border-slate-50 bg-[#F8FAFC]/50">
                <main className="max-w-5xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
                        {/* Avatar Section */}
                        <div className="relative group">
                            <VendorAvatar 
                                src={vendor.avatarUrl} 
                                alt={vendor.vendorName} 
                                size="lg" 
                                className="shadow-sm border border-slate-100 rounded-3xl"
                            />
                        </div>

                        {/* Summary Section */}
                        <div className="flex-1 text-center md:text-left">
                            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
                                <h1 className="text-4xl font-black tracking-tight text-slate-900">
                                    {vendor.businessName}
                                </h1>
                                <span className="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-100 mx-auto md:mx-0">
                                    Member since {memberSince}
                                </span>
                            </div>

                            <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-2xl mb-8">
                                {vendor.bio || `${vendor.businessName} is a professional service provider committed to excellence and customer satisfaction.`}
                            </p>

                            {/* Minimalist Stats Panel */}
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-8 border-t border-slate-100 pt-8 mt-auto">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                                        <Building2 className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-lg font-black text-slate-900 leading-none">{vendor.listingCount}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Services</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                                        <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-lg font-black text-slate-900 leading-none">{vendor.avgRating}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Avg Rating</span>
                                    </div>
                                </div>

                                <div className="h-10 w-[1px] bg-slate-100 mx-2 hidden sm:block" />

                                <div className="flex items-center gap-4">
                                    {vendor.listings?.[0] && (
                                        <ChatTrigger
                                            businessId={vendor.listings[0].id}
                                            businessName={vendor.businessName}
                                            variant="icon"
                                        />
                                    )}
                                    {vendor.businessPhone && (
                                        <a href={`tel:${vendor.businessPhone}`} className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm group">
                                            <Phone className="w-4 h-4 transition-transform group-hover:scale-110" />
                                        </a>
                                    )}
                                    {vendor.businessEmail && (
                                        <a href={`mailto:${vendor.businessEmail}`} className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm group">
                                            <Mail className="w-4 h-4 transition-transform group-hover:scale-110" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* ── Main Content Area ── */}
            <main className="max-w-5xl mx-auto px-6 py-20 pb-32">
                {/* ── Offers & Events Grid (Only if they exist) ── */}
                {activeOffers.length > 0 || activeEvents.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-12 mb-20">
                        {/* Offers Section */}
                        {activeOffers.length > 0 && (
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-orange-50 rounded-xl">
                                        <Gift className="w-5 h-5 text-orange-500" />
                                    </div>
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight text-center md:text-left">Exclusive Offers</h2>
                                </div>
                                <div className="space-y-4">
                                    {activeOffers.map(offer => (
                                        <div key={offer.id} className="group relative bg-white border border-slate-100 rounded-[20px] p-5 hover:border-orange-200 transition-all shadow-sm hover:shadow-md">
                                            <div className="flex gap-5">
                                                {offer.imageUrl && (
                                                    <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-50 border border-slate-50">
                                                        <img src={getImageUrl(offer.imageUrl) as string} alt={offer.title} className="w-full h-full object-cover" />
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h4 className="font-black text-slate-900 text-base">{offer.title}</h4>
                                                        {offer.offerBadge && (
                                                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-orange-500 text-white rounded-full">
                                                                {offer.offerBadge}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                                                        {offer.description}
                                                    </p>
                                                    {offer.expiryDate && (
                                                        <div className="flex items-center gap-1.5 text-slate-400">
                                                            <Clock className="w-3 h-3" />
                                                            <span className="text-[10px] font-bold uppercase tracking-widest">
                                                                Expires: {new Date(offer.expiryDate).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Events Section */}
                        {activeEvents.length > 0 && (
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-indigo-50 rounded-xl">
                                        <Ticket className="w-5 h-5 text-indigo-500" />
                                    </div>
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Upcoming Events</h2>
                                </div>
                                <div className="space-y-4">
                                    {activeEvents.map(event => (
                                        <div key={event.id} className="group flex bg-white border border-slate-100 rounded-[20px] overflow-hidden hover:border-indigo-200 transition-all shadow-sm hover:shadow-md">
                                            <div className="w-24 bg-indigo-600 p-4 flex flex-col items-center justify-center text-white text-center">
                                                <span className="text-xs font-black uppercase tracking-widest opacity-80">
                                                    {event.startDate ? new Date(event.startDate).toLocaleString('default', { month: 'short' }) : '---'}
                                                </span>
                                                <span className="text-2xl font-black leading-none my-1">
                                                    {event.startDate ? new Date(event.startDate).getDate() : '--'}
                                                </span>
                                            </div>
                                            <div className="p-5 flex-1">
                                                <h4 className="font-black text-slate-900 text-base mb-1">{event.title}</h4>
                                                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-2">
                                                    {event.description}
                                                </p>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1.5 text-indigo-600 font-black text-[10px] uppercase tracking-widest">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        <span>{event.startDate ? new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Time TBD'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : null}

                {/* ── Search & Filter Panel ── */}
                <div className="mb-12">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-4">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Professional Showcase</h2>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-none">Discover our industry services</p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            {/* Search */}
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <input
                                    type="text"
                                    placeholder="Search listings..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                            </div>

                            {/* Count Badge */}
                            <div className="px-5 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                                {filteredListings.length} Results
                            </div>
                        </div>
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        <button
                            onClick={() => setActiveCategory(null)}
                            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${!activeCategory
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                                : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                                }`}
                        >
                            All Categories
                        </button>
                        {vendor.categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${activeCategory === cat
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-8">
                    {filteredListings.map((item) => (
                        <Link
                            key={item.id}
                            href={`/business/${item.slug}`}
                            className="group flex flex-col gap-6 bg-white rounded-3xl border border-slate-100 p-3 hover:border-slate-200 transition-all duration-500 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.06)]"
                        >
                            <div className="relative h-64 rounded-2xl overflow-hidden bg-slate-50">
                                {(() => {
                                    const imgSrc = item.images?.[0]
                                        ? getImageUrl(item.images[0]) as string
                                        : item.coverImageUrl
                                            ? getImageUrl(item.coverImageUrl) as string
                                            : item.logoUrl
                                                ? getImageUrl(item.logoUrl) as string
                                                : null;
                                    return imgSrc ? (
                                        <img src={imgSrc} alt={item.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Building2 className="w-12 h-12 text-slate-200" />
                                        </div>
                                    );
                                })()}
                                <div className="absolute top-4 left-4">
                                    <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-white/50">
                                        <Tag className="w-3.5 h-3.5 text-indigo-500" />
                                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                                            {item.categoryName || 'General'}
                                        </span>
                                    </div>
                                </div>
                                <div className="absolute top-4 right-4">
                                    <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-900/10 backdrop-blur-md rounded-xl text-slate-900 text-[11px] font-black border border-white/40">
                                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                        <span>{Number(item.averageRating).toFixed(1)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="px-5 pb-5 flex flex-col flex-1">
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight line-clamp-1">
                                        {item.title}
                                    </h3>
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center transition-all group-hover:bg-indigo-600 flex-shrink-0 group-hover:-translate-y-1">
                                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-white" />
                                    </div>
                                </div>

                                <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-50">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <MapPin className="w-4 h-4 text-indigo-400" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{item.city}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 text-emerald-500">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Online</span>
                                        </div>
                                        <ChatTrigger
                                            businessId={item.id}
                                            businessName={item.title}
                                            variant="icon"
                                            className="!p-2 !rounded-xl !border-slate-100"
                                        />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {filteredListings.length === 0 && (
                    <div className="text-center py-24 bg-[#F8FAFC] rounded-[1rem] border border-dashed border-slate-200">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <Search className="w-10 h-10 text-slate-200" />
                        </div>
                        <h4 className="text-lg font-black text-slate-900 mb-1">No services matched your filter</h4>
                        <p className="text-slate-400 text-sm font-medium">Try adjusting your search terms or category filter</p>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
