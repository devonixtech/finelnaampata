"use client";

import React, { useState, useEffect } from 'react';
import { Heart, Tag, Calendar, Bookmark } from 'lucide-react';
import { api } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import BusinessCard from '../../../components/BusinessCard';
import OfferCard from '../../../components/OfferCard';
import { Business } from '../../../types/api';
import Link from 'next/link';

type SavedTab = 'businesses' | 'offers' | 'events';

const TABS: { id: SavedTab; label: string; icon: React.ElementType }[] = [
    { id: 'businesses', label: 'Businesses', icon: Heart },
    { id: 'offers', label: 'Offers', icon: Tag },
    { id: 'events', label: 'Events', icon: Calendar },
];

export default function SavedPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<SavedTab>('businesses');
    const [savedBusinesses, setSavedBusinesses] = useState<Business[]>([]);
    const [savedOfferEvents, setSavedOfferEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSaved = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const [bizRes, oeRes] = await Promise.all([
                    api.users.getFavorites(),
                    api.users.getSavedOfferEvents(1, 50),
                ]);
                setSavedBusinesses(bizRes.data || []);
                const all = oeRes?.data || [];
                setSavedOfferEvents(all);
            } catch (error) {
                console.error('Error fetching saved items:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSaved();
    }, [user]);

    const savedOffers = savedOfferEvents.filter((item: any) => item.type === 'offer');
    const savedEvents = savedOfferEvents.filter((item: any) => item.type === 'event');

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest">Loading your saved items...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                    <Bookmark className="w-10 h-10 text-slate-300" />
                </div>
                <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Please Log In</h1>
                <p className="text-slate-400 font-bold max-w-md text-lg mb-8">You need to be logged in to view your saved items.</p>
                <Link href="/login" className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-blue-500/20 transition-all active:scale-95">
                    Login Now
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-20">
                <div>
                    <h1 className="text-4xl lg:text-5xl font-black text-slate-900 mb-3 tracking-tight flex items-center gap-4">
                        Saved Items <Bookmark className="w-8 h-8 text-rose-500 fill-rose-500" />
                    </h1>
                    <p className="text-slate-400 font-bold tracking-tight text-lg">Your curated collection.</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-slate-100 pb-0">
                    {TABS.map((tab) => {
                        const count = tab.id === 'businesses' ? savedBusinesses.length : tab.id === 'offers' ? savedOffers.length : savedEvents.length;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === tab.id ? 'text-slate-900 border-slate-900' : 'text-slate-300 border-transparent hover:text-slate-500'}`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                                <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">({count})</span>
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                {activeTab === 'businesses' && (
                    savedBusinesses.length > 0 ? (
                        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {savedBusinesses.map((biz) => (
                                <BusinessCard key={biz.id} business={biz} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-center px-4">
                            <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mb-6">
                                <Heart className="w-10 h-10 text-rose-200" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">No saved businesses</h3>
                            <p className="text-slate-400 font-bold max-w-sm mb-10">Start browsing the directory and click the heart icon to save businesses for later.</p>
                            <Link href="/search" className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all active:scale-95">
                                Discover Businesses
                            </Link>
                        </div>
                    )
                )}

                {activeTab === 'offers' && (
                    savedOffers.length > 0 ? (
                        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {savedOffers.map((offer: any) => (
                                <OfferCard
                                    key={offer.id}
                                    offer={offer}
                                    onEnquire={() => router.push(`/offers-events/${offer.id}`)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-center px-4">
                            <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mb-6">
                                <Tag className="w-10 h-10 text-orange-200" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">No saved offers</h3>
                            <p className="text-slate-400 font-bold max-w-sm mb-10">Browse offers and click the bookmark icon to save them for later.</p>
                            <Link href="/offers" className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all active:scale-95">
                                Browse Offers
                            </Link>
                        </div>
                    )
                )}

                {activeTab === 'events' && (
                    savedEvents.length > 0 ? (
                        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {savedEvents.map((event: any) => (
                                <OfferCard
                                    key={event.id}
                                    offer={event}
                                    onEnquire={() => router.push(`/offers-events/${event.id}`)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-center px-4">
                            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-6">
                                <Calendar className="w-10 h-10 text-blue-200" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">No saved events</h3>
                            <p className="text-slate-400 font-bold max-w-sm mb-10">Browse events and click the bookmark icon to save them for later.</p>
                            <Link href="/events" className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all active:scale-95">
                                Browse Events
                            </Link>
                        </div>
                    )
                )}
            </div>
    );
}
