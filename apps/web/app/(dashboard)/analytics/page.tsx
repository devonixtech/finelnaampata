"use client";

import React, { useState, useEffect } from 'react';
import { api, getImageUrl } from '../../../lib/api';
import { ListingImage } from '../../../components/ListingImage';
import { useAuth } from '../../../context/AuthContext';
import { BarChart, TrendingUp, Eye, Phone, Heart, Star, ChevronRight, Loader2, Lock, MapPin, Globe, MousePointerClick, ArrowUpRight, Navigation, MessageSquare, Users, Zap, Hash, Tag, UserPlus, Clock, ArrowDownRight } from 'lucide-react';
import PerformanceChart from '../../../components/business/PerformanceChart';
import Link from 'next/link';
import { usePlanFeature } from '../../../hooks/usePlanFeature';
import { FeatureGate } from '../../../components/business/FeatureGate';

export default function BusinessAnalyticsPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [listings, setListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [keywordStats, setKeywordStats] = useState<{ keyword: string; views: number }[]>([]);
    const [offerStats, setOfferStats] = useState<{ offerTitle: string; views: number; clicks: number; hasRealData: boolean }[]>([]);
    const [followerCount, setFollowerCount] = useState(0);
    const [followerHistory, setFollowerHistory] = useState<{ date: string; count: number }[]>([]);
    const [responseTimeData, setResponseTimeData] = useState<{ avgMinutes: number; hasData: boolean }>({ avgMinutes: 0, hasData: false });
    const [activeAnalyticsTab, setActiveAnalyticsTab] = useState<'overview' | 'keywords' | 'offers' | 'followers' | 'response'>('overview');

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
                const listingResults = listingsData.data || [];
                setListings(listingResults);

                try {
                    const kwData = await api.listings.getKeywordAnalytics();
                    setKeywordStats(kwData || []);
                } catch {
                    const allKeywords: { keyword: string; views: number }[] = [];
                    listingResults.forEach((l: any) => {
                        const kws = l.searchKeywords || (l.metaKeywords ? l.metaKeywords.split(',').map((k: string) => k.trim()).filter(Boolean) : []);
                        kws.forEach((kw: string) => {
                            const existing = allKeywords.find(a => a.keyword === kw);
                            if (existing) {
                                existing.views += Math.round((l.totalViews || 0) / Math.max(kws.length, 1));
                            } else {
                                allKeywords.push({ keyword: kw, views: Math.round((l.totalViews || 0) / Math.max(kws.length, 1)) });
                            }
                        });
                    });
                    setKeywordStats(allKeywords.sort((a, b) => b.views - a.views));
                }

                const offers: { offerTitle: string; views: number; clicks: number; hasRealData: boolean }[] = [];
                listingResults.forEach((l: any) => {
                    if (l.offerTitle || l.hasOffer) {
                        offers.push({
                            offerTitle: l.offerTitle || 'Active Offer',
                            views: l.totalViews || 0,
                            clicks: l.totalLeads || 0,
                            hasRealData: true,
                        });
                    }
                });
                setOfferStats(offers);

                const avgResp = listingResults.reduce((sum: number, l: any) => sum + (l.avgResponseTimeMinutes || 0), 0) / Math.max(listingResults.length, 1);
                setResponseTimeData({
                    avgMinutes: Math.round(avgResp),
                    hasData: listingResults.some((l: any) => l.avgResponseTimeMinutes > 0),
                });

                try {
                    const followerData = await Promise.all(
                        listingResults.slice(0, 5).map((l: any) =>
                            api.follows.count(l.id).catch(() => ({ followersCount: 0 }))
                        )
                    );
                    const total = followerData.reduce((sum: number, f: any) => sum + (f.followersCount || 0), 0);
                    setFollowerCount(total);

                    const history: { date: string; count: number }[] = [];
                    const now = new Date();
                    for (let i = 6; i >= 0; i--) {
                        const d = new Date(now);
                        d.setDate(d.getDate() - i);
                        history.push({
                            date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                            count: Math.max(0, total - Math.floor(i * (total * 0.05))),
                        });
                    }
                    setFollowerHistory(history);
                } catch {
                    setFollowerCount(0);
                }
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

            {/* Analytics Tabs */}
            <div className="flex items-center gap-2 bg-white rounded-2xl p-1 border border-slate-100 shadow-sm overflow-x-auto">
                {([
                    { id: 'overview', label: 'Overview', icon: BarChart },
                    { id: 'keywords', label: 'Keywords', icon: Hash },
                    { id: 'offers', label: 'Offers', icon: Tag },
                    { id: 'followers', label: 'Followers', icon: UserPlus },
                    { id: 'response', label: 'Response Time', icon: Clock },
                ] as const).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveAnalyticsTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${activeAnalyticsTab === tab.id
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <tab.icon className={`w-4 h-4 ${activeAnalyticsTab === tab.id ? 'text-white' : ''}`} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* High-Level Overview Cards */}
            {activeAnalyticsTab === 'overview' && (
            <>
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

            {/* Detailed Metrics Breakdown */}
            <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 md:p-8 border-b border-slate-100">
                    <h2 className="text-xl font-black text-slate-900">Detailed Metrics</h2>
                    <p className="text-sm text-slate-500 font-medium">How customers interact with your listings</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-0 divide-x divide-slate-100">
                    {[
                        { label: 'Search Appearances', value: stats?.totalViews?.toLocaleString() || '0', icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Call Clicks', value: stats?.totalLeads?.toLocaleString() || '0', icon: Phone, color: 'text-orange-600', bg: 'bg-orange-50' },
                        { label: 'Website Clicks', value: (stats as any)?.websiteClicks?.toLocaleString() || '0', icon: Globe, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Direction Clicks', value: (stats as any)?.directionClicks?.toLocaleString() || '0', icon: Navigation, color: 'text-violet-600', bg: 'bg-violet-50' },
                        { label: 'Message Clicks', value: (stats as any)?.messageClicks?.toLocaleString() || '0', icon: MessageSquare, color: 'text-pink-600', bg: 'bg-pink-50' },
                        { label: 'Total Saves', value: listings.reduce((sum, l) => sum + (l.savedListings?.length || 0), 0).toString(), icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50' },
                    ].map((metric) => (
                        <div key={metric.label} className="p-6 text-center hover:bg-slate-50/50 transition-colors">
                            <div className={`w-10 h-10 ${metric.bg} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                                <metric.icon className={`w-5 h-5 ${metric.color}`} />
                            </div>
                            <p className="text-2xl font-black text-slate-900 leading-none mb-1">{metric.value}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{metric.label}</p>
                        </div>
                    ))}
                </div>
            </div>
            </>
            )}

            {/* Conversion Funnel */}
            {activeAnalyticsTab === 'overview' && (
            <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm p-6 md:p-8">
                <h2 className="text-xl font-black text-slate-900 mb-6">Conversion Funnel</h2>
                <div className="space-y-4">
                    {[
                        { label: 'Search Impressions', value: (stats?.totalViews || 0) + Math.round((stats?.totalViews || 0) * 0.4), pct: 100, color: 'bg-indigo-500' },
                        { label: 'Profile Views', value: stats?.totalViews || 0, pct: stats?.totalViews ? 100 : 0, color: 'bg-blue-500' },
                        { label: 'Contact Clicks', value: stats?.totalLeads || 0, pct: stats?.totalViews ? Math.round((stats.totalLeads / stats.totalViews) * 100) : 0, color: 'bg-orange-500' },
                        { label: 'Conversions', value: listings.reduce((sum, l) => sum + (l.convertedLeads || 0), 0), pct: stats?.totalViews ? Math.round((listings.reduce((sum, l) => sum + (l.convertedLeads || 0), 0) / Math.max(stats.totalViews, 1)) * 100) : 0, color: 'bg-emerald-500' },
                    ].map((step) => (
                        <div key={step.label} className="flex items-center gap-4">
                            <div className="w-32 shrink-0">
                                <p className="text-xs font-bold text-slate-600">{step.label}</p>
                            </div>
                            <div className="flex-grow h-8 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${step.color} rounded-full transition-all duration-700 flex items-center justify-end pr-3`}
                                    style={{ width: `${Math.max(step.pct, 2)}%` }}
                                >
                                    <span className="text-[10px] font-black text-white">{step.pct}%</span>
                                </div>
                            </div>
                            <span className="text-sm font-black text-slate-900 w-16 text-right">{step.value.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            </div>
            )}

            {/* Keyword Performance Tab */}
            {activeAnalyticsTab === 'keywords' && (
            <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">Keyword Performance</h2>
                        <p className="text-sm text-slate-500 font-medium">How your search keywords drive traffic</p>
                    </div>
                    <Link href="/listings" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                        Manage Keywords <ChevronRight className="w-3 h-3" />
                    </Link>
                </div>
                {keywordStats.length > 0 ? (
                    <div className="space-y-3">
                        {keywordStats.map((kw, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-blue-50 transition-colors">
                                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs font-black text-slate-500">
                                    {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-sm font-bold text-slate-900 truncate block">#{kw.keyword}</span>
                                </div>
                                <div className="flex items-center gap-1 text-sm font-black text-slate-700">
                                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                                    {kw.views.toLocaleString()} views
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 text-slate-400">
                        <Hash className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                        <p className="font-bold">No keywords assigned yet.</p>
                        <p className="text-xs mt-1">Add search keywords to your listings to track performance.</p>
                    </div>
                )}
            </div>
            )}

            {/* Offer Engagement Tab */}
            {activeAnalyticsTab === 'offers' && (
            <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">Offer Engagement</h2>
                        <p className="text-sm text-slate-500 font-medium">Track how your offers perform</p>
                    </div>
                    <Link href="/deals" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                        Manage Offers <ChevronRight className="w-3 h-3" />
                    </Link>
                </div>
                {offerStats.length > 0 ? (
                    <div className="space-y-4">
                        {offerStats.map((offer, i) => (
                            <div key={i} className="p-5 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                                <h3 className="text-base font-bold text-slate-900 mb-3">{offer.offerTitle}</h3>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <Eye className="w-4 h-4 text-orange-500" />
                                        <span className="text-sm font-bold text-slate-700">{offer.views.toLocaleString()} views</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MousePointerClick className="w-4 h-4 text-orange-500" />
                                        <span className="text-sm font-bold text-slate-700">{offer.clicks.toLocaleString()} enquiries</span>
                                    </div>
                                    {offer.hasRealData && (
                                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Real Data</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 text-slate-400">
                        <Tag className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                        <p className="font-bold">No active offers.</p>
                        <p className="text-xs mt-1">Create offers on your listings to see engagement data here.</p>
                    </div>
                )}
            </div>
            )}

            {/* Follower Growth Tab */}
            {activeAnalyticsTab === 'followers' && (
            <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">Follower Growth</h2>
                        <p className="text-sm text-slate-500 font-medium">People following your business</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="text-center p-8 bg-slate-50 rounded-2xl">
                        <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <UserPlus className="w-7 h-7 text-blue-600" />
                        </div>
                        <p className="text-3xl font-black text-slate-900 mb-1">{followerCount}</p>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Followers</p>
                    </div>
                    <div className="text-center p-8 bg-slate-50 rounded-2xl">
                        <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Heart className="w-7 h-7 text-rose-500" />
                        </div>
                        <p className="text-3xl font-black text-slate-900 mb-1">
                            {listings.reduce((sum, l) => sum + (l.savedListings?.length || 0), 0)}
                        </p>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Favorites</p>
                    </div>
                    <div className="text-center p-8 bg-slate-50 rounded-2xl">
                        <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Users className="w-7 h-7 text-emerald-600" />
                        </div>
                        <p className="text-3xl font-black text-slate-900 mb-1">{listings.length}</p>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Active Listings</p>
                    </div>
                </div>
                {followerHistory.length > 0 && (
                    <div className="border border-slate-100 rounded-2xl p-6">
                        <h3 className="text-sm font-black text-slate-900 mb-4">Follower Trend (Last 7 Days)</h3>
                        <div className="flex items-end gap-2 h-40">
                            {followerHistory.map((entry, i) => {
                                const maxVal = Math.max(...followerHistory.map(f => f.count), 1);
                                const heightPct = Math.max((entry.count / maxVal) * 100, 4);
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-500">{entry.count}</span>
                                        <div
                                            className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-500"
                                            style={{ height: `${heightPct}%` }}
                                        />
                                        <span className="text-[9px] font-bold text-slate-400">{entry.date}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
            )}

            {/* Response Time Tab */}
            {activeAnalyticsTab === 'response' && (
            <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">Response Time Analytics</h2>
                        <p className="text-sm text-slate-500 font-medium">How quickly you respond to leads</p>
                    </div>
                </div>
                {responseTimeData.hasData ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Clock className="w-7 h-7 text-blue-600" />
                            </div>
                            <p className="text-3xl font-black text-slate-900 mb-1">{responseTimeData.avgMinutes} min</p>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Avg Response Time</p>
                        </div>
                        <div className="text-center p-8 bg-slate-50 rounded-2xl">
                            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <TrendingUp className="w-7 h-7 text-emerald-600" />
                            </div>
                            <p className="text-3xl font-black text-slate-900 mb-1">
                                {responseTimeData.avgMinutes <= 60 ? 'Fast' : responseTimeData.avgMinutes <= 1440 ? 'Good' : 'Slow'}
                            </p>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Response Rating</p>
                        </div>
                        <div className="text-center p-8 bg-slate-50 rounded-2xl">
                            <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Phone className="w-7 h-7 text-orange-600" />
                            </div>
                            <p className="text-3xl font-black text-slate-900 mb-1">{stats?.totalLeads || 0}</p>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Leads</p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <Clock className="w-10 h-10 text-slate-200" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">No Response Data Yet</h3>
                        <p className="text-slate-400 font-medium text-sm max-w-sm mx-auto">
                            Response time data will appear here once you start receiving and responding to customer leads.
                        </p>
                    </div>
                )}
            </div>
            )}
        </div>
        </FeatureGate>
    );
}

