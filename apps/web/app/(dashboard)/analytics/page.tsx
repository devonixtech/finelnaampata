"use client";

import React, { useState, useEffect } from 'react';
import { api, getImageUrl } from '../../../lib/api';
import { ListingImage } from '../../../components/ListingImage';
import { useAuth } from '../../../context/AuthContext';
import { BarChart, TrendingUp, Eye, Phone, Heart, Star, ChevronRight, Loader2, Lock } from 'lucide-react';
import PerformanceChart from '../../../components/vendor/PerformanceChart';
import Link from 'next/link';
import { usePlanFeature } from '../../../hooks/usePlanFeature';
import { FeatureGate } from '../../../components/vendor/FeatureGate';

export default function BusinessAnalyticsPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [listings, setListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const isVendor = user?.role === 'vendor';

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!user) return;
            try {
                setLoading(true);
                const [statsData, listingsData] = await Promise.all([
                    api.businessProfiles.getStats(),
                    api.listings.getMyListings({ limit: 10, sort: 'views_desc' })
                ]);
                setStats(statsData);
                setListings(listingsData.data || []);
            } catch (err) {
                console.error("Failed to fetch analytics", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [user]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Loading Analytics...</p>
            </div>
        );
    }

    // Analytics unlocked for all businesses as per user request.

    // Sort listings by views for top performers
    const topListings = [...listings].sort((a, b) => b.totalViews - a.totalViews).slice(0, 5);

    return (
        <FeatureGate feature="showAnalytics" title="Unlock Performance Analytics" description="Get deep insights into how your business is performing, track views, leads, and customer engagement trends.">
            <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 text-blue-600 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                        <BarChart className="w-5 h-5" />
                    </div>
                    <span className="font-bold tracking-tight">Performance Data</span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                    Analytics Dashboard
                </h1>
                <p className="text-slate-500 text-lg max-w-2xl leading-relaxed">
                    Track your listing views, leads, and customer engagement across all your business profiles over time.
                </p>
            </div>

            {/* High-Level Overview Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-[20px] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center hover:border-blue-200 transition-colors">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                        <Eye className="w-6 h-6" />
                    </div>
                    <p className="text-3xl font-black text-slate-900 leading-none mb-1">
                        {stats?.totalViews?.toLocaleString() || '0'}
                    </p>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Profile Views</p>
                </div>

                <div className="bg-white p-6 rounded-[20px] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center hover:border-orange-200 transition-colors">
                    <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-4">
                        <Phone className="w-6 h-6" />
                    </div>
                    <p className="text-3xl font-black text-slate-900 leading-none mb-1">
                        {stats?.totalLeads?.toLocaleString() || '0'}
                    </p>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Leads Generated</p>
                </div>

                <div className="bg-white p-6 rounded-[20px] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center hover:border-rose-200 transition-colors">
                    <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-4">
                        <Heart className="w-6 h-6" />
                    </div>
                    <p className="text-3xl font-black text-slate-900 leading-none mb-1">
                        {listings.reduce((sum, l) => sum + (l.savedListings?.length || 0), 0)}
                    </p>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Saves (Favorites)</p>
                </div>

                <div className="bg-white p-6 rounded-[20px] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center hover:border-emerald-200 transition-colors">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <p className="text-3xl font-black text-slate-900 leading-none mb-1">
                        {stats?.totalViews > 0 ? ((stats.totalLeads / stats.totalViews) * 100).toFixed(1) : '0'}%
                    </p>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Conversion Rate</p>
                </div>
            </div>

            {/* Render the Visual Chart block */}
            <div className="pt-4">
                <PerformanceChart stats={stats} />
            </div>

            {/* Top Performing Listings */}
            <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">Top Performing Listings</h2>
                        <p className="text-sm text-slate-500 font-medium">Your businesses ranked by total profile views</p>
                    </div>
                    <Link href="/listings" className="hidden sm:flex text-sm font-bold text-blue-600 hover:text-blue-700 items-center gap-1 transition-colors">
                        Manage all listings <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="divide-y divide-slate-100">
                    {topListings.length > 0 ? topListings.map((listing, index) => (
                        <div key={listing.id} className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-center gap-4 flex-grow w-full">
                                <span className="font-black text-slate-300 text-2xl w-6">#{index + 1}</span>
                                <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0">
                                    <ListingImage 
                                        src={listing.coverImageUrl || listing.images?.[0]} 
                                        alt={listing.title} 
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{listing.title}</h3>
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{listing.category?.name || 'Local'}</span>
                                    <div className="flex gap-2">
                                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full">{listing.status}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Listing Stats */}
                            <div className="flex items-center gap-6 w-full md:w-auto shrink-0 pt-4 md:pt-0 border-t border-slate-100 md:border-0">
                                <div className="text-center w-20">
                                    <div className="text-lg font-black text-slate-900">{listing.totalViews.toLocaleString()}</div>
                                    <div className="flex items-center justify-center gap-1 text-[10px] uppercase font-bold text-slate-400">
                                        <Eye className="w-3 h-3" /> Views
                                    </div>
                                </div>
                                <div className="w-px h-8 bg-slate-200" />
                                <div className="text-center w-20">
                                    <div className="text-lg font-black text-slate-900">{listing.totalLeads.toLocaleString()}</div>
                                    <div className="flex items-center justify-center gap-1 text-[10px] uppercase font-bold text-slate-400">
                                        <Phone className="w-3 h-3" /> Leads
                                    </div>
                                </div>
                                <div className="w-px h-8 bg-slate-200" />
                                <div className="text-center w-20">
                                    <div className="text-lg font-black text-slate-900 flex items-center justify-center gap-1">
                                        {listing.averageRating} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                    </div>
                                    <div className="flex items-center justify-center gap-1 text-[10px] uppercase font-bold text-slate-400">
                                        ({listing.totalReviews} Rev)
                                    </div>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="p-10 text-center text-slate-500 font-medium">
                            No listings found. Once you add listings and get traffic, your top performers will appear here.
                        </div>
                    )}
                </div>
            </div>
        </div>
        </FeatureGate>
    );
}
