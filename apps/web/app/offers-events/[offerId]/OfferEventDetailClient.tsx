'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, getImageUrl } from '../../../lib/api';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import {
    Calendar, Tag, MapPin, Bookmark, Share2, CheckCircle2,
    Phone, Globe, Facebook, Instagram, Twitter, Compass, ChevronRight, Home, ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';

export default function OfferEventDetailClient() {
    const { offerId: id } = useParams() as { offerId: string };
    const router = useRouter();
    const [offer, setOffer] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();
    const [isSaved, setIsSaved] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [interactionLoading, setInteractionLoading] = useState(false);
    const [showShareToast, setShowShareToast] = useState(false);

    const mapQuery = `${offer?.business?.address || ''} ${offer?.business?.city || ''} ${offer?.business?.state || ''}`.trim();
    const mapEmbedSrc = mapQuery
        ? `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`
        : null;

    useEffect(() => {
        const fetchDetails = async () => {
            let actualId = id;

            // Handle SPA fallback where the page is served by a 'template' HTML file
            if ((id === 'template' || id === '1') && typeof window !== 'undefined') {
                const pathParts = window.location.pathname.split('/').filter(Boolean);
                // URL structure: /offers-events/id/ or /offers-events/id
                if (pathParts[0] === 'offers-events' && pathParts[1] && pathParts[1] !== 'template' && pathParts[1] !== '1') {
                    actualId = pathParts[1];
                    console.log('[OfferEventDetail] Fallback detected, using actual ID from URL:', actualId);
                }
            }

            try {
                let data: any = null;
                try {
                    data = await api.deals.getById(actualId);
                    if (data) data = { ...data, type: 'offer' };
                } catch {
                    data = null;
                }
                if (!data) {
                    const eventData = await api.events.getById(actualId);
                    data = { ...eventData, type: 'event' };
                }
                setOffer(data);

                // Initial status check for logged-in users
                if (localStorage.getItem('token') && data?.business?.id) {
                    // Check initial following status
                    api.follows.check(data.business.id)
                        .then(res => setIsFollowing(res.isFollowing))
                        .catch(err => console.error('Follow check failed:', err));

                    // Check initial saved status
                    api.users.getSavedOfferEvents(1, 50)
                        .then(res => {
                            const found = (res.data || []).some((o: any) => o.id === data.id);
                            setIsSaved(found);
                        })
                        .catch(err => console.error('Saved offers check failed:', err));
                }
            } catch (err: any) {
                console.error(err);
                setError('Failed to load details. The offer may have expired or been removed.');
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-slate-100 rounded-full" />
                        <div className="absolute inset-0 w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Curating details...</p>
                </div>
            </div>
        );
    }

    if (error || !offer) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                    <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                        <Tag className="w-12 h-12" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 mb-4">Content Not Found</h1>
                    <p className="text-slate-500 max-w-md mx-auto mb-8">{error}</p>
                    <button onClick={() => router.back()} className="px-8 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-orange-600 transition-all shadow-xl shadow-slate-200">
                        Return to Browsing
                    </button>
                </div>
                <Footer />
            </div>
        );
    }

    const isEvent = offer.type === 'event';
    const primaryColor = isEvent ? 'blue' : 'orange';
    const accentColorClass = isEvent ? 'from-blue-600 to-indigo-600' : 'from-orange-500 to-red-600';

    // Mock data for highlights and terms if they are empty
    const displayHighlights = offer.highlights && offer.highlights.length > 0
        ? offer.highlights
        : [`${offer.offerBadge || 'Special'} for all customers`, 'Top quality service', 'Limited time exclusive offer', 'Family friendly atmosphere'];

    // --- Action Handlers ---

    const handleFollow = async () => {
        if (!user) {
            router.push('/login?redirect=' + window.location.pathname);
            return;
        }
        if (!offer?.business?.id || interactionLoading) return;

        setInteractionLoading(true);
        try {
            const wasFollowing = isFollowing;
            setIsFollowing(!wasFollowing); // Optimistic UI
            const result = wasFollowing
                ? await api.follows.unfollow(offer.business.id)
                : await api.follows.follow(offer.business.id);
            // result from follow/unfollow might not contain isFollowing, so we rely on the action taken
            setIsFollowing(!wasFollowing); 
        } catch (err) {
            console.error('Follow toggle failed:', err);
            setIsFollowing(isFollowing); // Rollback
        } finally {
            setInteractionLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user) {
            router.push('/login?redirect=' + window.location.pathname);
            return;
        }
        if (!offer?.id || interactionLoading) return;

        setInteractionLoading(true);
        try {
            const wasSaved = isSaved;
            setIsSaved(!wasSaved);
            if (wasSaved) {
                await api.users.removeSavedOfferEvent(offer.id);
            } else {
                await api.users.addSavedOfferEvent(offer.id);
            }
        } catch (err) {
            console.error('Save toggle failed:', err);
            setIsSaved(isSaved);
        } finally {
            setInteractionLoading(false);
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: offer.title,
            text: `Check out this offer: ${offer.title} at ${offer.business?.title}`,
            url: window.location.href,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                setShowShareToast(true);
                setTimeout(() => setShowShareToast(false), 3000);
            }
        } catch (err) {
            console.error('Share failed:', err);
        }
    };

    const handleClaim = async () => {
        const business = offer.business;
        if (!business) return;

        // Create a lead record for dashboard visibility
        if (user) {
            try {
                await api.leads.createLead({
                    businessId: business.id,
                    name: user.fullName || 'User',
                    email: user.email,
                    phone: user.phone || '',
                    message: `Claimed Offer: "${offer.title}"`,
                    type: 'whatsapp'
                });
            } catch (err) {
                console.warn('Lead creation failed, proceeding with redirect:', err);
            }
        }

        if (business.phone) {
            const offerTitle = offer.title;
            const businessName = business.title;
            const message = `Hi ${businessName}, I'm interested in the "${offerTitle}" offer I saw on the local directory. Is it still available?`;
            const encoded = encodeURIComponent(message);
            // Format phone: ensure it's just numbers
            const cleanPhone = business.phone.replace(/\D/g, '');
            // For Pakistan, if it starts with 0, replace with 92
            const formattedPhone = cleanPhone.startsWith('0') ? '92' + cleanPhone.substring(1) : cleanPhone;
            
            window.open(`https://wa.me/${formattedPhone}?text=${encoded}`, '_blank');
        } else if (business.website) {
            window.open(business.website, '_blank');
        } else {
            alert("This offer can be claimed at the store location.");
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFDFD] font-sans">
            <Navbar />

            {/* Breadcrumbs */}
            <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
                <nav className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">
                    <Link href="/" className="hover:text-slate-900 transition-colors flex items-center gap-1.5 shrink-0">
                        <Home className="w-3.5 h-3.5" />
                        Home
                    </Link>
                    <ChevronRight className="w-3 h-3 text-slate-200" />
                    <Link href="/offers-events" className="hover:text-slate-900 transition-colors shrink-0">Offers</Link>
                    <ChevronRight className="w-3 h-3 text-slate-200" />
                    <span className="text-slate-900 truncate">{offer.title}</span>
                </nav>
            </div>

            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 lg:px-8 mb-12">
                <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200 aspect-[21/9] md:aspect-[21/7] border-4 border-white ring-1 ring-slate-100">
                    <img
                        src={getImageUrl(offer.imageUrl) || undefined}
                        alt={offer.title}
                        className="absolute inset-0 w-full h-full object-cover transform hover:scale-105 transition-transform duration-1000"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />

                    {offer.offerBadge && (
                        <div className="absolute top-0 left-8 z-20">
                            <div className="relative">
                                <div className="bg-gradient-to-br from-orange-600 to-red-600 text-white px-6 py-8 rounded-b-2xl shadow-2xl flex flex-col items-center justify-center animate-in slide-in-from-top-4 duration-700">
                                    <span className="text-2xl font-black leading-none">{offer.offerBadge.split(' ')[0]}</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-90">{offer.offerBadge.split(' ')[1] || 'OFF'}</span>
                                </div>
                                <div className="absolute -bottom-2 left-0 right-0 h-2 bg-gradient-to-t from-transparent to-black/20" />
                            </div>
                        </div>
                    )}

                    <div className="absolute bottom-24 left-10 right-10 z-20">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl md:text-6xl font-black text-white tracking-tight drop-shadow-lg mb-3"
                        >
                            {offer.title}
                        </motion.h1>
                        <div className="flex items-center gap-4 text-white/90">
                            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-sm font-bold">
                                <Calendar className="w-4 h-4" />
                                {new Date(offer.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {new Date(offer.expiryDate || offer.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 z-30 bg-[#FF7904]/90 backdrop-blur-md px-10 py-5 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-white/10">
                        <div className="flex-1">
                            <p className="text-white font-medium text-sm md:text-lg leading-snug max-w-2xl">
                                {offer.description ? offer.description.split('.')[0] + '.' : `Enjoy this exclusive ${offer.type} at ${offer.business?.title}.`}
                            </p>
                        </div>
                        <button
                            onClick={handleClaim}
                            className="whitespace-nowrap px-10 py-4 bg-[#FF7904] hover:bg-[#FF8C24] text-white font-black rounded-2xl border-2 border-white/20 shadow-lg transition-all active:scale-95 uppercase tracking-widest text-xs"
                        >
                            Claim Offer Now
                        </button>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                    <button
                        onClick={handleSave}
                        disabled={interactionLoading}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-sm text-sm border ${isSaved
                            ? 'bg-orange-50 text-orange-600 border-orange-200'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-orange-500' : ''}`} />
                        {isSaved ? 'Saved to Favorites' : 'Save Offer'}
                    </button>
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm text-sm"
                    >
                        <Share2 className="w-4 h-4" />
                        Share
                    </button>
                </div>
            </div>

            {/* Main Content Sections */}
            <div className="max-w-7xl mx-auto px-4 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-12 pb-32">
                <div className="lg:col-span-2 space-y-12">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 lg:p-12 shadow-sm">
                        <h2 className="text-3xl font-black text-slate-900 mb-10 tracking-tight">Offer Details</h2>

                        <div className="space-y-8 mb-16">
                            <div className="flex gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                    <Calendar className="w-6 h-6 text-[#FF7904]" />
                                </div>
                                <div className="pt-1">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Dates</h4>
                                    <p className="text-lg font-bold text-slate-800">
                                        {new Date(offer.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {new Date(offer.expiryDate || offer.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                    <MapPin className="w-6 h-6 text-[#FF7904]" />
                                </div>
                                <div className="pt-1">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Location</h4>
                                    <p className="text-lg font-bold text-slate-800 leading-relaxed">
                                        {offer.business?.address}, {offer.business?.city}, Pakistan
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                    <ShieldCheck className="w-6 h-6 text-[#FF7904]" />
                                </div>
                                <div className="pt-1">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Description</h4>
                                    <p className="text-lg font-medium text-slate-600 leading-relaxed">
                                        {offer.description || offer.title}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mb-16 pt-10 border-t border-slate-50">
                            <h3 className="text-xl font-black text-slate-900 mb-8 tracking-tight">Offer Highlights</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">
                                {displayHighlights.map((item: any, i: number) => (
                                    <div key={i} className="flex items-center gap-4 group">
                                        <div className="w-6 h-6 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold text-slate-700 tracking-tight">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm relative overflow-hidden group">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8">Restaurant Info</h3>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-28 h-28 rounded-3xl bg-slate-50 border border-slate-100 shadow-inner p-3 mb-6 flex items-center justify-center overflow-hidden">
                                {offer.business?.logoUrl ? (
                                    <img src={getImageUrl(offer.business.logoUrl) || undefined} className="w-full h-full object-contain" />
                                ) : (
                                    <div className="text-3xl font-black text-slate-300 uppercase">{offer.business?.title[0]}</div>
                                )}
                            </div>
                            <h4 className="text-2xl font-black text-slate-900 mb-2 truncate max-w-full">{offer.business?.title}</h4>
                            <p className="text-[11px] font-black uppercase tracking-widest text-[#FF7904] mb-4 flex items-center gap-1.5 justify-center">
                                <Compass className="w-3.5 h-3.5" /> 3.2 km away
                            </p>
                            <div className="flex flex-col items-center gap-2 mb-8">
                                <div className="flex text-yellow-500">
                                    {[1, 2, 3, 4, 5].map(s => <span key={s} className="text-xl">★</span>)}
                                </div>
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">({offer.business?.totalReviews || '230'} reviews)</span>
                            </div>
                            <div className="w-full space-y-4 pt-6 border-t border-slate-50">
                                <a href={`tel:${offer.business?.phone}`} className="flex items-center gap-4 group">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#FF7904] group-hover:text-white transition-all duration-300">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold text-slate-700 tracking-tight group-hover:text-[#FF7904] transition-colors">{offer.business?.phone}</span>
                                </a>
                                <div className="flex items-center gap-4 py-2">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                                        <Globe className="w-5 h-5" />
                                    </div>
                                    <div className="flex gap-4">
                                        <Twitter className="w-5 h-5 text-slate-400 cursor-pointer hover:text-[#1DA1F2] transition-colors" />
                                        <Facebook className="w-5 h-5 text-slate-400 cursor-pointer hover:text-[#1877F2] transition-colors" />
                                        <Instagram className="w-5 h-5 text-slate-400 cursor-pointer hover:text-[#E4405F] transition-colors" />
                                    </div>
                                </div>
                                <a href={offer.business?.website || '#'} className="flex items-center gap-4 group">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#FF7904] group-hover:text-white transition-all duration-300">
                                        <Globe className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold text-slate-700 tracking-tight truncate group-hover:text-[#FF7904] transition-colors">{offer.business?.website || 'Visit Website'}</span>
                                </a>
                            </div>
                        </div>

                        <div className="mt-10 rounded-[2rem] overflow-hidden relative group/map border border-slate-200 shadow-inner h-64 bg-slate-50">
                            {mapEmbedSrc ? (
                                <iframe
                                    title={`Map for ${offer.business?.title || 'business'}`}
                                    src={mapEmbedSrc}
                                    className="w-full h-full"
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                                    <MapPin className="w-7 h-7 text-slate-400 mb-2" />
                                    <p className="text-xs font-bold text-slate-500">Map preview unavailable</p>
                                </div>
                            )}
                            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-center shadow-lg border border-white/20 group-hover:bg-[#FF7904] group-hover:text-white transition-all cursor-pointer"
                                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${offer.business?.latitude},${offer.business?.longitude}`, '_blank')}>
                                Get Directions
                            </div>
                        </div>

                        <button
                            onClick={handleFollow}
                            disabled={interactionLoading}
                        className={`absolute top-8 right-8 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-lg transition-all ${
                            isFollowing
                                ? 'bg-slate-900 text-white shadow-slate-200'
                                : 'bg-[#FF7904] text-white shadow-orange-200 hover:shadow-orange-300'
                        }`}>
                            {isFollowing ? 'Following' : 'Follow'}
                        </button>
                    </div>

                    <button
                        onClick={handleClaim}
                        className="w-full py-6 bg-[#FF7904] hover:bg-[#FF8C24] text-white rounded-[2rem] font-black shadow-2xl shadow-orange-200 transition-all active:scale-95 uppercase tracking-widest text-sm flex items-center justify-center gap-3 group"
                    >
                        Claim Offer Now
                        <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform">
                            <ChevronRight className="w-4 h-4" />
                        </div>
                    </button>
                </div>
            </div>

            <Footer />

            {/* Share link copied toast */}
            <AnimatePresence>
                {showShareToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 shadow-2xl rounded-2xl px-8 py-4 flex items-center gap-3 border border-white/10"
                    >
                        <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-white font-bold text-sm tracking-tight">Link copied to clipboard!</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
