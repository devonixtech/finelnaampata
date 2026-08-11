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
import BusinessAvatar from '../../../components/BusinessAvatar';
import ChatTrigger from '../../../components/chat/ChatTrigger';
import Footer from '../../../components/Footer';

interface BusinessProfile {
    id: string;
    slug: string;
    businessName: string;
    vendorName: string;
    contactName?: string;
    businessEmail?: string;
    businessPhone?: string;
    namedPhoneNumbers?: { label: string; number: string; }[];
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

export default function BusinessProfileClient({ slugOrId, initialData }: { slugOrId: string, initialData?: any }) {
    const router = useRouter();
    const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(initialData || null);
    const [loading, setLoading] = useState(!initialData);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            let actualSlug = slugOrId;

            if (typeof window !== 'undefined') {
                const pathParts = window.location.pathname.split('/').filter(Boolean);
                const urlParams = new URLSearchParams(window.location.search);
                const querySlug = urlParams.get('originalSlug');

                if ((pathParts[0] === 'businesses' || pathParts[0] === 'vendors') && pathParts[1] && pathParts[1] !== 'template' && pathParts[1] !== 'default') {
                    if (!businessProfile || actualSlug !== pathParts[1]) {
                        actualSlug = pathParts[1];
                        console.log('[BusinessProfile] Route detected from URL:', actualSlug);
                    }
                } else if (querySlug) {
                    actualSlug = querySlug;
                    console.log('[BusinessProfile] Route detected from query param:', actualSlug);
                }
            }

            try {
                let data = businessProfile;

                if (data && data.slug !== actualSlug && data.id !== actualSlug) {
                    console.log('[BusinessProfile] Slug mismatch, forcing reload for:', actualSlug);
                    data = null;
                }

                if (!data) {
                    const profileData = await api.businessProfiles.getPublicProfile(actualSlug);
                    if (!profileData) {
                        throw new Error('Business profile not found');
                    }

                    if (profileData.slug && actualSlug !== profileData.slug && typeof window !== 'undefined' && window.location.pathname.startsWith('/vendors/')) {
                        router.replace(`/businesses/${profileData.slug}`);
                        return;
                    }

                    setBusinessProfile(profileData);
                }
            } catch (err: any) {
                console.error('[BusinessProfile] Failed to load profile:', err);
                setError(err.message || 'Failed to load business profile.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [slugOrId, router]);

    const filteredListings = businessProfile?.listings?.filter((item) => {
        const matchesSearch = !searchTerm || item.title?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !activeCategory || item.categoryName === activeCategory;
        return matchesSearch && matchesCategory;
    }) || [];

    const filteredOffers = businessProfile?.offers?.filter((offer) =>
        !searchTerm || offer.title?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const filteredEvents = businessProfile?.events?.filter((event) =>
        !searchTerm || event.title?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !businessProfile) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="max-w-4xl mx-auto px-4 py-20 text-center">
                    <h1 className="text-3xl font-black text-slate-900 mb-4">Business profile unavailable</h1>
                    <p className="text-slate-500 font-medium mb-8">{error || 'The requested business profile could not be found.'}</p>
                    <Link href="/business" className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 text-white font-bold">
                        <ArrowLeft className="w-4 h-4" /> Back to Businesses
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    const avatar = businessProfile.avatarUrl ? getImageUrl(businessProfile.avatarUrl) : null;
    const memberSince = businessProfile.createdAt ? new Date(businessProfile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently';
    const additionalPhoneNumbers = (businessProfile.namedPhoneNumbers || []).filter((item) => item?.label && item?.number);

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid lg:grid-cols-[320px_minmax(0,1fr)] gap-10 items-start">
                    <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 sticky top-28">
                        <div className="flex flex-col items-center text-center">
                            <BusinessAvatar
                                src={avatar}
                                alt={businessProfile.businessName}
                                size="xl"
                                className="shadow-sm mb-6"
                            />
                            <h2 className="text-2xl font-black text-slate-900">{businessProfile.businessName}</h2>
                            <p className="text-sm text-slate-500 font-bold mt-2">{businessProfile.contactName || businessProfile.vendorName}</p>

                            <div className="grid grid-cols-3 gap-3 w-full mt-8">
                                <div className="bg-white rounded-2xl p-4 border border-slate-100">
                                    <p className="text-lg font-black text-slate-900">{businessProfile.listingCount}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Listings</p>
                                </div>
                                <div className="bg-white rounded-2xl p-4 border border-slate-100">
                                    <p className="text-lg font-black text-slate-900">{businessProfile.avgRating}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Rating</p>
                                </div>
                                <div className="bg-white rounded-2xl p-4 border border-slate-100">
                                    <p className="text-lg font-black text-slate-900">{businessProfile.totalViews}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Views</p>
                                </div>
                            </div>

                            <div className="w-full mt-8 space-y-3 text-left">
                                {businessProfile.businessPhone && (
                                    <a href={`tel:${businessProfile.businessPhone}`} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 border border-slate-100">
                                        <Phone className="w-4 h-4 text-slate-400" />
                                        <span className="text-sm font-bold text-slate-700">{businessProfile.businessPhone}</span>
                                    </a>
                                )}
                                {additionalPhoneNumbers.map((item, index) => (
                                    <a key={`${item.label}-${item.number}-${index}`} href={`tel:${item.number}`} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 border border-slate-100">
                                        <Phone className="w-4 h-4 text-slate-400" />
                                        <span className="text-sm font-bold text-slate-700">{item.label}: {item.number}</span>
                                    </a>
                                ))}
                                {businessProfile.businessEmail && (
                                    <a href={`mailto:${businessProfile.businessEmail}`} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 border border-slate-100">
                                        <Mail className="w-4 h-4 text-slate-400" />
                                        <span className="text-sm font-bold text-slate-700 truncate">{businessProfile.businessEmail}</span>
                                    </a>
                                )}
                                {businessProfile.businessAddress && (
                                    <div className="flex items-start gap-3 bg-white rounded-2xl px-4 py-3 border border-slate-100">
                                        <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                                        <span className="text-sm font-bold text-slate-700">{businessProfile.businessAddress}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 border border-slate-100">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm font-bold text-slate-700">Member since {memberSince}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-4xl font-black tracking-tight text-slate-900">{businessProfile.businessName}</h1>
                                <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-3xl mt-4">
                                    {businessProfile.bio || `${businessProfile.businessName} is committed to helping customers discover its services and offerings with clarity.`}
                                </p>
                            </div>
                            {businessProfile.listings?.[0] && (
                                <ChatTrigger
                                    businessId={businessProfile.listings[0].id}
                                    businessName={businessProfile.businessName}
                                />
                            )}
                        </div>

                        <div className="bg-slate-50 rounded-[2rem] border border-slate-100 p-6 flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search listings, offers, or events"
                                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-900 outline-none"
                                />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setActiveCategory(null)}
                                    className={`px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider border ${!activeCategory ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}
                                >
                                    All
                                </button>
                                {businessProfile.categories.map((category) => (
                                    <button
                                        key={category}
                                        onClick={() => setActiveCategory(category)}
                                        className={`px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider border ${activeCategory === category ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <section className="space-y-5">
                            <div className="flex items-center gap-3">
                                <Building2 className="w-5 h-5 text-slate-400" />
                                <h3 className="text-2xl font-black text-slate-900">Listings</h3>
                            </div>
                            <div className="grid md:grid-cols-2 gap-5">
                                {filteredListings.map((item) => (
                                    <Link key={item.id} href={`/business/${item.slug || item.id}`} className="bg-white rounded-[1.75rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                        {(item.coverImageUrl || item.images?.[0]) && (
                                            <img src={getImageUrl(item.coverImageUrl || item.images[0]) || ''} alt={item.title} className="w-full h-48 object-cover" />
                                        )}
                                        <div className="p-5">
                                            <div className="flex items-center justify-between gap-3 mb-3">
                                                <h4 className="text-lg font-black text-slate-900">{item.title}</h4>
                                                <ChevronRight className="w-4 h-4 text-slate-300" />
                                            </div>
                                            <div className="flex items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                <span>{item.categoryName || 'Business'}</span>
                                                <span>{item.city || 'Location not listed'}</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>

                        {filteredOffers.length > 0 && (
                            <section className="space-y-5">
                                <div className="flex items-center gap-3">
                                    <Gift className="w-5 h-5 text-slate-400" />
                                    <h3 className="text-2xl font-black text-slate-900">Offers</h3>
                                </div>
                                <div className="grid md:grid-cols-2 gap-5">
                                    {filteredOffers.map((offer) => (
                                        <Link key={offer.id} href={`/offers-events/${offer.id}`} className="bg-slate-50 rounded-[1.75rem] border border-slate-100 p-5">
                                            <h4 className="text-lg font-black text-slate-900">{offer.title}</h4>
                                            <p className="text-sm font-medium text-slate-500 mt-2">{offer.description}</p>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {filteredEvents.length > 0 && (
                            <section className="space-y-5">
                                <div className="flex items-center gap-3">
                                    <Ticket className="w-5 h-5 text-slate-400" />
                                    <h3 className="text-2xl font-black text-slate-900">Events</h3>
                                </div>
                                <div className="grid md:grid-cols-2 gap-5">
                                    {filteredEvents.map((event) => (
                                        <Link key={event.id} href={`/offers-events/${event.id}`} className="bg-slate-50 rounded-[1.75rem] border border-slate-100 p-5">
                                            <h4 className="text-lg font-black text-slate-900">{event.title}</h4>
                                            <p className="text-sm font-medium text-slate-500 mt-2">{event.description}</p>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
