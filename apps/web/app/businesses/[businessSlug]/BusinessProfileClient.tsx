"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Star, Mail, Phone, MapPin,
    Calendar, Building2, Globe, ArrowLeft,
    TrendingUp, Award, Clock, Search, Filter,
    Tag, Gift, Ticket, ChevronRight, ShieldCheck,
    Navigation, MessageSquare, MessageCircle, Bookmark, Share2,
    CheckCircle2, Images, User, Store
} from 'lucide-react';
import { api, getImageUrl } from '../../../lib/api';
import Navbar from '../../../components/Navbar';
import ChatTrigger from '../../../components/chat/ChatTrigger';
import Footer from '../../../components/Footer';
import CategoriesSidebar from '../../../components/CategoriesSidebar';

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
    const [activeTab, setActiveTab] = useState('overview');
    const [showLightbox, setShowLightbox] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [showMapEmbed, setShowMapEmbed] = useState(false);

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
                    }
                } else if (querySlug) {
                    actualSlug = querySlug;
                }
            }

            try {
                let data = businessProfile;

                if (data && data.slug !== actualSlug && data.id !== actualSlug) {
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

    // Extract cover images from top listings
    const galleryImages = (businessProfile.listings || [])
        .map(l => l.coverImageUrl || l.images?.[0])
        .filter(Boolean)
        .slice(0, 3)
        .map(url => getImageUrl(url)!);

    const openLightbox = (index: number) => {
        setCurrentImageIndex(index);
        setShowLightbox(true);
    };

    let mapEmbedUrl = null;
    if (businessProfile.businessAddress) {
        mapEmbedUrl = `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&q=${encodeURIComponent(businessProfile.businessAddress)}`;
    } else if (businessProfile.listings?.[0]?.address) {
         mapEmbedUrl = `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&q=${encodeURIComponent(businessProfile.listings[0].address)}`;
    }

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            
            <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 lg:py-12">
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    
                    {/* Left Sidebar (Categories) */}
                    <div className="hidden lg:block w-[300px] shrink-0 sticky top-28">
                        <CategoriesSidebar />
                    </div>

                    {/* Right Main Content */}
                    <div className="flex-1 w-full bg-white relative">
                        
                        <main className="w-full">
                            {/* TOP HEADER: 3-Column Photo Layout */}
                            <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-2 mb-6 h-[300px] md:h-[400px]">
                                {/* Main Large Image (Left) */}
                                <div
                                    className="relative rounded-l-2xl overflow-hidden bg-slate-100 cursor-pointer group h-full"
                                    onClick={() => galleryImages.length > 0 && openLightbox(0)}
                                >
                                    {galleryImages.length > 0 ? (
                                        <>
                                            <img
                                                src={galleryImages[0]}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                alt={businessProfile.businessName}
                                            />
                                            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                            <Images className="w-12 h-12 mb-2" />
                                            <span className="text-xs font-medium">No photos</span>
                                        </div>
                                    )}
                                </div>

                                {/* Right Column (Map Top, Grid Bottom) */}
                                <div className="hidden md:grid grid-rows-2 gap-2 h-full">
                                    {/* Map */}
                                    <div className={`relative overflow-hidden bg-slate-100 cursor-pointer group ${galleryImages.length <= 1 ? 'row-span-2 rounded-r-2xl' : 'rounded-tr-2xl'}`}>
                                        {mapEmbedUrl ? (
                                            showMapEmbed ? (
                                                <iframe
                                                    title="Business location map"
                                                    src={mapEmbedUrl}
                                                    className="w-full h-full border-0"
                                                    loading="lazy"
                                                    referrerPolicy="no-referrer-when-downgrade"
                                                />
                                            ) : (
                                                <div className="w-full h-full relative" onClick={() => setShowMapEmbed(true)}>
                                                    <div className="absolute inset-0 bg-slate-200 animate-pulse" />
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors bg-white/50 backdrop-blur-sm">
                                                        <MapPin className="w-8 h-8 mb-2" />
                                                        <span className="text-sm font-bold">See Map</span>
                                                    </div>
                                                </div>
                                            )
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                                <MapPin className="w-8 h-8 mb-2" />
                                                <span className="text-xs">No Location</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Smaller Photos Grid */}
                                    {galleryImages.length > 1 && (
                                        <div className="grid grid-cols-2 gap-2 h-full relative">
                                            <div
                                                className="relative overflow-hidden bg-slate-100 cursor-pointer group"
                                                onClick={() => openLightbox(1)}
                                            >
                                                <img src={galleryImages[1]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Gallery 2" />
                                            </div>
                                            <div
                                                className="relative rounded-br-2xl overflow-hidden bg-slate-100 cursor-pointer group"
                                                onClick={() => galleryImages.length > 2 ? openLightbox(2) : undefined}
                                            >
                                                {galleryImages.length > 2 ? (
                                                    <img src={galleryImages[2]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Gallery 3" />
                                                ) : (
                                                    <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300">
                                                        <Images className="w-6 h-6 opacity-50" />
                                                    </div>
                                                )}
                                                {businessProfile.listings?.length > 3 && (
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center hover:bg-black/50 transition-colors">
                                                        <div className="flex items-center gap-2 text-white font-medium text-sm">
                                                            <Images className="w-4 h-4" />
                                                            See all
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* TITLE BLOCK */}
                            <div className="mb-6 flex flex-col md:flex-row items-start md:items-center gap-6">
                                {avatar && (
                                    <img 
                                        src={avatar} 
                                        alt={businessProfile.businessName} 
                                        className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-full border border-slate-200 shadow-sm shrink-0" 
                                    />
                                )}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                                            {businessProfile.businessName}
                                        </h1>
                                        {businessProfile.isVerified && (
                                            <ShieldCheck className="w-6 h-6 text-blue-500 fill-blue-50" />
                                        )}
                                    </div>
                                    
                                    <div className="flex flex-wrap items-center gap-3 text-sm mb-4">
                                        <div className="flex items-center gap-1">
                                            <span className="font-bold text-slate-900">{businessProfile.avgRating > 0 ? businessProfile.avgRating.toFixed(1) : 'New'}</span>
                                            <div className="flex text-amber-400">
                                                {[1,2,3,4,5].map((i) => (
                                                    <Star key={i} className={`w-4 h-4 ${i <= businessProfile.avgRating ? 'fill-current' : 'text-slate-300'}`} />
                                                ))}
                                            </div>
                                            <span className="text-slate-500">({businessProfile.totalViews} views)</span>
                                        </div>
                                        <span className="text-slate-300">·</span>
                                        <span className="text-slate-700 font-medium">{businessProfile.listingCount} Listings</span>
                                        {businessProfile.categories?.[0] && (
                                            <>
                                                <span className="text-slate-300">·</span>
                                                <span className="text-slate-700">{businessProfile.categories[0]}</span>
                                            </>
                                        )}
                                    </div>

                                    {/* ACTION BUTTONS (Pills) */}
                                    <div className="flex flex-wrap gap-3">
                                        {businessProfile.socialLinks?.find(l => l.platform.toLowerCase() === 'website') && (
                                            <a 
                                                href={businessProfile.socialLinks.find(l => l.platform.toLowerCase() === 'website')?.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors text-sm font-bold text-blue-600"
                                            >
                                                <Globe className="w-4 h-4" /> Website
                                            </a>
                                        )}
                                        {businessProfile.businessPhone && (
                                            <a 
                                                href={`tel:${businessProfile.businessPhone}`}
                                                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors text-sm font-bold text-blue-600"
                                            >
                                                <Phone className="w-4 h-4" /> Call
                                            </a>
                                        )}
                                        {businessProfile.listings?.[0] && (
                                            <ChatTrigger
                                                businessId={businessProfile.listings[0].id}
                                                businessName={businessProfile.businessName}
                                                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors text-sm font-bold text-blue-600"
                                            />
                                        )}
                                        <button onClick={() => setIsFavorite(!isFavorite)} className={`flex items-center gap-2 px-5 py-2.5 bg-white border rounded-full transition-colors text-sm font-bold ${isFavorite ? 'border-blue-200 text-blue-600' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                                            <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-blue-500 text-blue-500' : ''}`} /> Save
                                        </button>
                                        <button onClick={() => setShowShareModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors text-sm font-bold text-slate-700">
                                            <Share2 className="w-4 h-4" /> Share
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* TABS */}
                            <div className="flex gap-8 border-b border-slate-200 mb-8 overflow-x-auto">
                                {['Overview', 'Listings', 'Offers & Events', 'About'].map((tab) => {
                                    const tabId = tab.toLowerCase().split(' ')[0]; // 'overview', 'listings', 'offers', 'about'
                                    return (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tabId)}
                                        className={`pb-4 text-sm font-bold whitespace-nowrap border-b-4 transition-colors ${
                                            activeTab === tabId
                                                ? 'border-blue-600 text-blue-600'
                                                : 'border-transparent text-slate-500 hover:text-slate-900'
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                )})}
                            </div>

                            {/* TAB CONTENT */}
                            <div className="min-h-[400px]">
                                
                                {/* OVERVIEW TAB */}
                                {activeTab === 'overview' && (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Business Information Card */}
                                        <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm relative overflow-hidden">
                                            <h3 className="text-lg font-bold text-slate-900 mb-6">Vendor Information</h3>
                                            
                                            <div className="space-y-6 relative z-10">
                                                {businessProfile.businessAddress && (
                                                    <div className="flex gap-4 group">
                                                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                                                            <MapPin className="w-5 h-5 text-slate-600" />
                                                        </div>
                                                        <div className="pt-1">
                                                            <div className="text-sm text-slate-800">{businessProfile.businessAddress}</div>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {businessProfile.businessPhone && (
                                                    <div className="flex gap-4 group">
                                                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                                                            <Phone className="w-5 h-5 text-slate-600" />
                                                        </div>
                                                        <div className="pt-1 flex-1">
                                                            <a href={`tel:${businessProfile.businessPhone}`} className="text-sm font-medium text-blue-600 hover:underline">{businessProfile.businessPhone}</a>
                                                        </div>
                                                    </div>
                                                )}

                                                {businessProfile.businessEmail && (
                                                    <div className="flex gap-4 group">
                                                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                                                            <Mail className="w-5 h-5 text-slate-600" />
                                                        </div>
                                                        <div className="pt-1 overflow-hidden">
                                                            <a href={`mailto:${businessProfile.businessEmail}`} className="text-sm font-medium text-blue-600 hover:underline block truncate">
                                                                {businessProfile.businessEmail}
                                                            </a>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* About / Highlights Card */}
                                        <div className="space-y-6">
                                            <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm">
                                                <h3 className="text-lg font-bold text-slate-900 mb-6">About</h3>
                                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                                    {businessProfile.bio || `${businessProfile.businessName} is a verified vendor on our platform.`}
                                                </p>
                                                <div className="mt-8 pt-6 border-t border-slate-100">
                                                    <div className="flex items-center gap-3">
                                                        <Calendar className="w-5 h-5 text-slate-400" />
                                                        <span className="text-sm font-medium text-slate-700">Vendor since {memberSince}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* LISTINGS TAB */}
                                {activeTab === 'listings' && (
                                    <div className="animate-in fade-in duration-500 space-y-6">
                                        <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 flex flex-col sm:flex-row gap-4">
                                            <div className="relative flex-1">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <input
                                                    type="text"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    placeholder="Search listings..."
                                                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-5">
                                            {filteredListings.length > 0 ? filteredListings.map((item) => (
                                                <Link key={item.id} href={`/business/${item.slug || item.id}`} className="bg-white rounded-[1.75rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                                                    {(item.coverImageUrl || item.images?.[0]) ? (
                                                        <div className="w-full h-48 overflow-hidden">
                                                            <img src={getImageUrl(item.coverImageUrl || item.images[0]) || ''} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-full h-48 bg-slate-100 flex items-center justify-center">
                                                            <Store className="w-10 h-10 text-slate-300" />
                                                        </div>
                                                    )}
                                                    <div className="p-5 relative">
                                                        {item.categoryName && (
                                                            <span className="absolute -top-4 right-4 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider text-blue-600 rounded-full shadow-sm border border-slate-100">
                                                                {item.categoryName}
                                                            </span>
                                                        )}
                                                        <div className="flex items-center justify-between gap-3 mb-2 pt-2">
                                                            <h4 className="text-lg font-black text-slate-900 line-clamp-1">{item.title}</h4>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                            <span>{item.city || 'Location not specified'}</span>
                                                        </div>
                                                    </div>
                                                </Link>
                                            )) : (
                                                <div className="col-span-full py-12 text-center text-slate-500">
                                                    No listings found matching your search.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* OFFERS & EVENTS TAB */}
                                {activeTab === 'offers' && (
                                    <div className="animate-in fade-in duration-500 space-y-8">
                                        {filteredOffers.length > 0 && (
                                            <section className="space-y-5">
                                                <h3 className="text-xl font-bold text-slate-900">Offers</h3>
                                                <div className="grid md:grid-cols-2 gap-5">
                                                    {filteredOffers.map((offer) => (
                                                        <Link key={offer.id} href={`/offers-events/${offer.id}`} className="bg-slate-50 rounded-[1.75rem] border border-slate-100 p-6 hover:shadow-md transition-shadow">
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                                                    <Gift className="w-5 h-5 text-blue-600" />
                                                                </div>
                                                                <h4 className="text-lg font-black text-slate-900">{offer.title}</h4>
                                                            </div>
                                                            <p className="text-sm font-medium text-slate-600">{offer.description}</p>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </section>
                                        )}

                                        {filteredEvents.length > 0 && (
                                            <section className="space-y-5 mt-8">
                                                <h3 className="text-xl font-bold text-slate-900">Events</h3>
                                                <div className="grid md:grid-cols-2 gap-5">
                                                    {filteredEvents.map((event) => (
                                                        <Link key={event.id} href={`/offers-events/${event.id}`} className="bg-slate-50 rounded-[1.75rem] border border-slate-100 p-6 hover:shadow-md transition-shadow">
                                                            <h4 className="text-lg font-black text-slate-900 mb-2">{event.title}</h4>
                                                            <p className="text-sm font-medium text-slate-600">{event.description}</p>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </section>
                                        )}

                                        {(filteredOffers.length === 0 && filteredEvents.length === 0) && (
                                             <div className="py-12 text-center text-slate-500 border border-slate-100 rounded-3xl">
                                                No active offers or events currently available.
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ABOUT TAB */}
                                {activeTab === 'about' && (
                                    <div className="animate-in fade-in duration-500 max-w-3xl">
                                        <h3 className="text-xl font-bold text-slate-900 mb-6">About {businessProfile.businessName}</h3>
                                        <div className="prose prose-slate prose-p:leading-relaxed max-w-none">
                                            {businessProfile.bio ? (
                                                businessProfile.bio.split('\n').map((paragraph, idx) => (
                                                    <p key={idx} className="mb-4 text-slate-700">{paragraph}</p>
                                                ))
                                            ) : (
                                                <p className="text-slate-500 italic">No detailed description provided.</p>
                                            )}
                                        </div>
                                        
                                        {businessProfile.socialLinks && businessProfile.socialLinks.length > 0 && (
                                            <div className="mt-10 pt-8 border-t border-slate-100">
                                                <h4 className="text-sm font-bold text-slate-900 mb-4">Connect on Social Media</h4>
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    {businessProfile.socialLinks.map((link: any, idx: number) => {
                                                        const platform = link.platform.toLowerCase();
                                                        let Icon = Globe;
                                                        if (platform.includes('facebook')) Icon = Globe;
                                                        if (platform.includes('instagram')) Icon = Globe;
                                                        return (
                                                            <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="p-3 rounded-full bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors" title={link.platform}>
                                                                <Icon className="w-5 h-5" />
                                                            </a>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </main>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
