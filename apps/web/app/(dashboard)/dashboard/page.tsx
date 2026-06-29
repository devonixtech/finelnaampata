"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import StatsGrid from '../../../components/business/StatsGrid';
import PerformanceChart from '../../../components/business/PerformanceChart';
import RecentReviews from '../../../components/business/RecentReviews';
import { Star, ChevronRight, ListTree, Heart, MessageSquare, Plus, TrendingUp, Loader2, Bell, CheckCircle2, Zap, Share2, Copy, Gift, Mail, Clock, BadgeCheck } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import Link from 'next/link';
import { api, getImageUrl } from '../../../lib/api';
import { ListingImage } from '../../../components/ListingImage';
import { Business } from '../../../types/api';
import { motion } from 'framer-motion';
import BusinessHotDemandWidget from '../../../components/business/BusinessHotDemandWidget';
import BusinessLeadsInbox from '../../../components/leads/VendorLeadsInbox';
import MyJobLeads from '../../../components/leads/MyJobLeads';
import MyInquiries from '../../../components/leads/MyInquiries';
import { chatApi } from '../../../services/chat.service';
import { useChatSocket } from '../../../hooks/useChat';
import { usePlanFeature } from '../../../hooks/usePlanFeature';
import { useSocket } from '../../../context/SocketContext';

export default function GenericDashboard() {
    const router = useRouter();
    const { user } = useAuth();
    const { hasFeature, planName } = usePlanFeature();
    const [stats, setStats] = useState<any>(null);
    const [savedBusinesses, setSavedBusinesses] = useState<Business[]>([]);
    const [recentReviews, setRecentReviews] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [leads, setLeads] = useState<any[]>([]);
    const [newLeadsCount, setNewLeadsCount] = useState(0);
    const [enquiries, setEnquiries] = useState<any[]>([]);
    const [followedBusinesses, setFollowedBusinesses] = useState<Business[]>([]);
    const [demandInsights, setDemandInsights] = useState<any[]>([]);
    const [affiliateStats, setAffiliateStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [copySuccess, setCopySuccess] = useState(false);
    const [referralInput, setReferralInput] = useState('');
    const [isApplying, setIsApplying] = useState(false);
    const [applyStatus, setApplyStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [conversations, setConversations] = useState<any[]>([]);
    const [setupStatus, setSetupStatus] = useState<{ isCompleted: boolean; answers: Record<string, string[]> } | null>(null);
    const [vendorProfile, setVendorProfile] = useState<any>(null);
    const { socket } = useChatSocket();

    const isVendor = user?.role === 'vendor';
    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
    const profileCompletion = useMemo(() => {
        if (!isVendor) return null;
        const percent = typeof stats?.profileCompletion === 'number'
            ? Math.max(0, Math.min(100, Math.round(stats.profileCompletion)))
            : 0;
        const vendor = vendorProfile || user?.vendor;
        const missing: string[] = [];
        if (!vendor?.businessName) missing.push('Business Name');
        if (!vendor?.businessPhone) missing.push('Business Phone');
        if (!vendor?.businessAddress) missing.push('Business Address');
        if (!vendor?.city) missing.push('City');
        if (!vendor?.country) missing.push('Country');
        if (!vendor?.bio) missing.push('Business Bio');
        if (!vendor?.businessEmail) missing.push('Business Email');
        if (!vendor?.socialLinks?.length) missing.push('Social Links');
        if (!vendor?.businessHours || Object.keys(vendor.businessHours).length === 0) missing.push('Business Hours');
        if (!stats?.totalBusinesses) missing.push('First Listing');
        return { percent, missing };
    }, [isVendor, stats?.profileCompletion, stats?.totalBusinesses, user?.vendor, vendorProfile]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user) return;
            try {
                setLoading(true);

                const [favoritesData, followsData] = await Promise.all([
                    api.users.getFavorites(),
                    api.follows.myFollows()
                ]);

                setSavedBusinesses(favoritesData.data || []);
                setFollowedBusinesses(followsData.data || []);

                if (isVendor || isAdmin) {
                    const [statsData, businessProfile, affiliateData] = await Promise.all([
                        api.businessProfiles.getStats(),
                        api.businessProfiles.getProfile(),
                        api.affiliate.getStats().catch(() => null)
                    ]);
                    setStats(statsData);
                    setVendorProfile(businessProfile);
                    setAffiliateStats(affiliateData);

                    if (businessProfile?.id) {
                        const [reviewsData, leadsData] = await Promise.all([
                            api.reviews.findAll({ vendorId: businessProfile.id, limit: 5 }),
                            api.leads.getForVendor({ limit: 5 }),
                        ]);
                        setRecentReviews(reviewsData.data || []);
                        setLeads(leadsData.data || []);
                        setNewLeadsCount(leadsData.meta?.total || 0);
                    }

                    const demandData = await api.demand.getNearby();
                    setDemandInsights(demandData || []);
                    const statusData = await api.businessSetup.getStatus().catch(() => null);
                    setSetupStatus(statusData);
                } else {
                    const [reviewsData, notifsData] = await Promise.all([
                        api.reviews.findAll({ userId: user.id, limit: 5 }),
                        api.users.getNotifications({ limit: 5 })
                    ]);
                    setRecentReviews(reviewsData.data || []);
                    setNotifications(notifsData.data || []);

                    setStats({
                        savedCount: favoritesData.data?.length || 0,
                        reviewsCount: reviewsData.data?.length || 0,
                        unreadNotifs: notifsData.data?.filter((n: any) => !n.isRead).length || 0
                    });
                }

                if (isVendor || isAdmin) {
                    const convs = await chatApi.getVendorConversations() as any[];
                    setConversations(convs.slice(0, 5));
                } else if (user) {
                    const convs = await chatApi.getUserConversations() as any[];
                    setConversations(convs.slice(0, 5));
                }

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user, isVendor, isAdmin]);

    useEffect(() => {
        if (!socket) return;

        const onNewConversation = (conv: any) => {
            setConversations(prev => {
                if (prev.find(c => c.id === conv.id)) return prev;
                return [conv, ...prev].slice(0, 5);
            });
        };

        const onConversationUpdated = (update: any) => {
            setConversations(prev => {
                const existing = prev.find(c => c.id === update.conversationId);
                if (existing) {
                    return prev.map(c =>
                        c.id === update.conversationId
                            ? { ...c, lastMessage: update.lastMessage, lastMessageAt: update.lastMessageAt }
                            : c
                    ).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
                }
                return prev;
            });
        };

        socket.on('newConversation', onNewConversation);
        socket.on('conversationUpdated', onConversationUpdated);

        return () => {
            socket.off('newConversation', onNewConversation);
            socket.off('conversationUpdated', onConversationUpdated);
        };
    }, [socket]);

    const { unreadChatCount, newEnquiryCount } = useSocket();

    const businessStats = [
        { label: 'Total Listings', value: stats?.businessCount || '0', icon: ListTree, color: 'bg-gradient-to-br text-white from-blue-600 to-indigo-700', shadow: 'shadow-blue-500/10', onClick: () => router.push('/listings'), show: hasFeature('showListings') },
        { label: 'Total Views', value: stats?.totalViews || '0', icon: TrendingUp, color: 'bg-gradient-to-br from-emerald-500 to-teal-700', shadow: 'shadow-emerald-500/10', show: hasFeature('showAnalytics') },
        { label: 'Live Chat', value: String(unreadChatCount), icon: MessageSquare, color: 'bg-gradient-to-br from-indigo-500 to-blue-700', shadow: 'shadow-indigo-500/10', onClick: () => router.push('/chat'), show: hasFeature('showChat') },
        { label: 'New Leads', value: String(newEnquiryCount), icon: Zap, color: 'bg-gradient-to-br from-orange-400 to-red-600', shadow: 'shadow-orange-500/10', onClick: () => router.push('/messages'), show: hasFeature('showLeads') },
        { label: 'Total Reviews', value: stats?.totalReviews || recentReviews.length || '0', icon: Star, color: 'bg-gradient-to-br from-pink-500 to-rose-700', shadow: 'shadow-pink-500/10', show: hasFeature('showReviews') },
    ].filter(s => (s as any).show !== false);

    const userStats = [
        { label: 'Saved Businesses', value: String(stats?.savedCount || 0), icon: Heart, color: 'bg-gradient-to-br from-rose-500 to-rose-700', shadow: 'shadow-rose-500/10', onClick: () => router.push('/saved') },
        { label: 'Messages', value: String(unreadChatCount), icon: MessageSquare, color: 'bg-gradient-to-br from-indigo-500 to-indigo-700', shadow: 'shadow-indigo-500/10', onClick: () => router.push('/chat') },
        { label: 'Your Reviews', value: String(stats?.reviewsCount || 0), icon: Star, color: 'bg-gradient-to-br from-amber-400 to-amber-600', shadow: 'shadow-amber-500/10' },
        { label: 'Notifications', value: String(stats?.unreadNotifs || 0), icon: Bell, color: 'bg-gradient-to-br from-blue-500 to-blue-700', shadow: 'shadow-blue-500/10', onClick: () => router.push('/notifications') },
    ];

    const mappedReviews = recentReviews.map(r => ({
        id: r.id,
        user: r.user?.fullName || 'Anonymous',
        location: r.business?.title || r.business?.name || 'Business',
        rating: r.rating,
        comment: r.comment,
        avatar: r.user?.avatarUrl
    }));

    const copyReferralLink = () => {
        if (!affiliateStats?.referralCode) return;
        const link = `${window.location.origin}/?ref=${affiliateStats.referralCode}`;
        navigator.clipboard.writeText(link);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const handleApplyReferral = async () => {
        if (!referralInput.trim()) return;
        setIsApplying(true);
        setApplyStatus(null);
        try {
            const result = await api.affiliate.applyReferral(referralInput.trim());
            setApplyStatus({ type: 'success', message: result.message });
            setReferralInput('');
            const updatedStats = await api.affiliate.getStats();
            setAffiliateStats(updatedStats);
        } catch (error: any) {
            setApplyStatus({ type: 'error', message: error.message || 'Invalid referral code' });
        } finally {
            setIsApplying(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-600/10 rounded-full"></div>
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                </div>
                <p className="mt-6 text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] animate-pulse">Syncing Dashboard...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 lg:space-y-10 pb-20">
            {/* Welcome Header */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-6"
            >
                <div className="space-y-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 text-blue-600 font-black text-xs uppercase tracking-[0.2em] mb-2">
                        <div className="w-1 h-1 bg-blue-600 rounded-full animate-ping" />
                        Live Status
                    </div>
                    <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black text-slate-900 tracking-tight">
                        Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{user?.fullName?.split(' ')[0] || 'Member'}</span>!
                    </h1>
                    <p className="text-sm lg:text-base text-slate-500 font-bold max-w-2xl mx-auto md:mx-0">
                        {isVendor ? "Manage your presence and see how your listings are performing today." : "Track your favorites, reviews, and community interactions."}
                    </p>
                </div>

                {((isVendor || isAdmin) ? hasFeature('canAddListing') : false) && (
                    <Link
                        href="/add-listing"
                        className="group flex items-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-900/10 hover:bg-blue-600 hover:shadow-blue-600/20 active:scale-95 transition-all w-full sm:w-fit justify-center"
                    >
                        <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
                        Add New Listing
                    </Link>
                )}
            </motion.div>

            {/* Plan Status Banner */}
            {(isVendor || isAdmin) && user?.vendor?.activeSubscription && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none" />
                    <div className="p-5 sm:p-6 lg:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                                <BadgeCheck className="w-8 h-8 sm:w-9 sm:h-9 text-white" />
                            </div>
                            <div className="text-center sm:text-left">
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Current Subscription</p>
                                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight mb-1">
                                    {planName.toLowerCase().endsWith('plan') ? planName : `${planName} Plan`}
                                </h2>
                                <p className="text-slate-400 font-bold text-[11px] sm:text-xs flex items-center justify-center sm:justify-start gap-2">
                                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                                    {(() => {
                                        const end = new Date(user?.vendor?.activeSubscription.endDate);
                                        const days = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                                        if (days > 3000) return <span className="text-emerald-400">Lifetime Access</span>;
                                        return (
                                            <span className={days <= 4 ? "text-rose-400" : "text-blue-400"}>
                                                {days > 0 ? `Expires in ${days} days` : 'Renew Now'} · {end.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </span>
                                        );
                                    })()}
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/subscription"
                            className="flex items-center gap-2 px-6 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-sm transition-all border border-white/10 shadow-xl w-full sm:w-auto justify-center group"
                        >
                            Billing & Plans
                            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                </motion.div>
            )}

            {/* Stats Grid */}
            {isVendor && profileCompletion && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-sm"
                >
                    <div className="flex items-center justify-between gap-4 mb-3">
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Profile Completion</p>
                        <span className="text-sm font-black text-blue-700">{profileCompletion.percent}%</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-4">
                        <div className="h-full bg-blue-600" style={{ width: `${profileCompletion.percent}%` }} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {(() => {
                            const stepMap: Record<string, number> = {
                                'Business Name': 1,
                                'Business Bio': 12,
                                'Business Email': 10,
                                'Business Phone': 10,
                                'Business Address': 8,
                                'City': 8,
                                'Country': 8,
                                'Social Links': 14,
                                'Business Hours': 11,
                                'First Listing': 5,
                                'Logo': 20,
                                'Cover Image': 20,
                                'Map Confirmation': 9,
                                'Legal Consent': 21,
                                'Website & Social Media': 14,
                                'Amenities & Facilities': 15,
                                'Keywords': 17,
                            };
                            return profileCompletion.missing.slice(0, 4).map((item) => (
                                <Link
                                    key={item}
                                    href={stepMap[item] ? `/business-setup?step=${stepMap[item]}` : '/business-setup'}
                                    className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-amber-50 text-amber-700 border border-amber-200"
                                >
                                    Complete {item}
                                </Link>
                            ));
                        })()}
                    </div>
                </motion.div>
            )}
            <StatsGrid stats={isVendor || isAdmin ? businessStats : userStats} />

            <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                {/* Main Column */}
                <div className="lg:col-span-8 space-y-6 lg:space-y-8">
                    {/* Leads Section */}
                    {(isVendor || isAdmin) ? (
                        hasFeature('showLeads') && (
                            <div className="bg-white rounded-3xl p-4 sm:p-6 lg:p-8 border border-slate-100 shadow-sm overflow-hidden">
                                <BusinessLeadsInbox />
                            </div>
                        )
                    ) : (
                        <div className="space-y-6 lg:space-y-8">
                            {!isVendor && !isAdmin && user?.role === 'user' && (
                                <div className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl relative overflow-hidden group border border-slate-800">
                                    <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none transition-all group-hover:bg-blue-600/20" />
                                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                        <div className="text-center md:text-left">
                                            <div className="flex items-center justify-center md:justify-start gap-2 text-blue-400 font-black text-[10px] uppercase tracking-[0.2em] mb-4">
                                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                                                Business Opportunities
                                            </div>
                                            <h3 className="text-2xl sm:text-3xl font-black text-white mb-3 tracking-tight">Own a Business?</h3>
                                            <p className="text-slate-400 font-medium max-w-md text-sm lg:text-base leading-relaxed">
                                                Join our expert network, list your services, and connect with thousands of local customers.
                                            </p>
                                        </div>
                                        <Link
                                            href="/business-setup"
                                            className="group flex items-center justify-center gap-3 px-8 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black transition-all shadow-2xl shadow-blue-600/20 whitespace-nowrap active:scale-95 w-full md:w-auto"
                                        >
                                            <Zap className="w-5 h-5 text-white animate-pulse" />
                                            Create Business Profile
                                        </Link>
                                    </div>
                                </div>
                            )}
                            <div className="bg-white rounded-3xl p-4 sm:p-6 lg:p-8 border border-slate-100 shadow-sm">
                                <MyInquiries />
                            </div>
                            <div className="bg-white rounded-3xl p-4 sm:p-6 lg:p-8 border border-slate-100 shadow-sm">
                                <MyJobLeads />
                            </div>
                        </div>
                    )}

                    {/* Analytics Section */}
                    {(isVendor || isAdmin) && hasFeature('showAnalytics') && (
                        <div className="bg-white rounded-3xl p-4 sm:p-6 lg:p-8 border border-slate-100 shadow-sm space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                                        <TrendingUp className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Analytics</h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Performance Insights</p>
                                    </div>
                                </div>
                            </div>
                            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                                <div className="min-w-[600px] sm:min-w-0">
                                    <PerformanceChart stats={stats} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Saved & Following Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
                        {((isVendor || isAdmin) ? hasFeature('showSaved') : true) && (
                            <section className="bg-white rounded-3xl p-4 sm:p-6 lg:p-8 border border-slate-100 shadow-sm flex flex-col">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 shrink-0">
                                            <Heart className="w-5 h-5 fill-rose-500" />
                                        </div>
                                        <h3 className="text-lg font-black text-slate-900 tracking-tight">Saved Businesses</h3>
                                    </div>
                                    <Link href="/saved" className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                                        <ChevronRight className="w-5 h-5" />
                                    </Link>
                                </div>

                                <div className="space-y-4 flex-grow">
                                    {savedBusinesses.length > 0 ? (
                                        savedBusinesses.slice(0, 3).map((biz) => (
                                            <Link key={biz.id} href={`/business/${biz.slug}`} className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-md transition-all group">
                                                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-sm">
                                                    <ListingImage src={(biz as any).coverImageUrl || (biz as any).images?.[0]} alt={biz.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="text-sm font-black text-slate-900 truncate group-hover:text-blue-600 transition-colors">{biz.title}</h4>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{biz.category?.name || 'Local'}</p>
                                                </div>
                                            </Link>
                                        ))
                                    ) : (
                                        <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                            <p className="text-xs text-slate-400 font-bold italic">No saved businesses yet</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {((isVendor || isAdmin) ? hasFeature('showFollowing') : true) && (
                            <section className="bg-white rounded-3xl p-4 sm:p-6 lg:p-8 border border-slate-100 shadow-sm flex flex-col">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                                            <Bell className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-lg font-black text-slate-900 tracking-tight">Following</h3>
                                    </div>
                                    <Link href="/following" className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                                        <ChevronRight className="w-5 h-5" />
                                    </Link>
                                </div>

                                <div className="space-y-4 flex-grow">
                                    {followedBusinesses.length > 0 ? (
                                        followedBusinesses.slice(0, 3).map((biz) => (
                                            <Link key={biz.id} href={`/business/${biz.slug}`} className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-md transition-all group">
                                                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-sm">
                                                    <ListingImage src={(biz as any).coverImageUrl || (biz as any).images?.[0]} alt={(biz as any).title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="text-sm font-black text-slate-900 truncate group-hover:text-blue-600 transition-colors">{(biz as any).title}</h4>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{biz.category?.name || 'Local'}</p>
                                                </div>
                                            </Link>
                                        ))
                                    ) : (
                                        <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                            <p className="text-xs text-slate-400 font-bold italic">Not following anyone</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="xl:col-span-4 space-y-6 lg:space-y-8">
                    {/* Compact Notifications for Users */}
                    {!isVendor && !isAdmin && (
                        <div className="bg-white rounded-3xl p-4 sm:p-6 lg:p-8 border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                    <Bell className="w-5 h-5 text-blue-600" />
                                    Alerts
                                </h3>
                                <Link href="/notifications" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600">See All</Link>
                            </div>
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {notifications.length > 0 ? (
                                    notifications.slice(0, 10).map((notif) => (
                                        <div key={notif.id} className="flex gap-3 group cursor-pointer p-1 rounded-lg hover:bg-slate-50 transition-colors">
                                            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${notif.isRead ? 'bg-slate-200' : 'bg-blue-600 animate-pulse'}`} />
                                            <div>
                                                <h4 className={`text-xs font-black mb-1 ${notif.isRead ? 'text-slate-500' : 'text-slate-900'}`}>{notif.title}</h4>
                                                <p className="text-[11px] text-slate-400 font-medium line-clamp-2">{notif.message}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-xs text-slate-300 font-bold italic py-4">Clean slate! No alerts.</p>
                                )}
                            </div>
                        </div>
                    )}
                    <RecentReviews
                        reviews={mappedReviews}
                        loading={loading}
                        title={isVendor || isAdmin ? "Reviews" : "My Reviews"}
                    />

                    {isVendor && hasFeature('showDemand') && (
                        <BusinessHotDemandWidget insights={demandInsights} loading={loading} />
                    )}

                    {((isVendor || isAdmin) && hasFeature('showChat')) && (
                        <section className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Recent Chats</h3>
                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Live Support</p>
                                </div>
                                <Link href="/chat" className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                                    <MessageSquare className="w-5 h-5" />
                                </Link>
                            </div>
                            <div className="space-y-3">
                                {conversations.length > 0 ? (
                                    conversations.map((conv) => (
                                        <Link
                                            key={conv.id}
                                            href={`/chat?id=${conv.id}`}
                                            className="block p-4 rounded-2xl bg-slate-50 border border-transparent hover:border-blue-100 hover:bg-white hover:shadow-md transition-all group"
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-200 overflow-hidden shrink-0 shadow-inner">
                                                        {isVendor ? (
                                                            conv.user?.avatarUrl ? (
                                                                <img src={getImageUrl(conv.user.avatarUrl) as string} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600 font-black text-sm">{(conv.user?.fullName?.[0] || 'U').toUpperCase()}</div>
                                                            )
                                                        ) : (
                                                            conv.business?.logoUrl ? (
                                                                <img src={getImageUrl(conv.business.logoUrl) as string} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-orange-50 text-orange-600 font-black text-sm">{(conv.business?.title?.[0] || 'B').toUpperCase()}</div>
                                                            )
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-black text-slate-900 truncate">{isVendor ? (conv.user?.fullName || 'User') : (conv.business?.title || 'Business')}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold truncate italic">on {conv.business?.title || 'Listing'}</p>
                                                    </div>
                                                </div>
                                                <span className="text-[9px] text-slate-300 font-bold whitespace-nowrap shrink-0">{new Date(conv.lastMessageAt || conv.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short' })}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 line-clamp-1 mt-3 pl-1 bg-white/50 rounded-lg p-1">
                                                {conv.lastMessage || 'Click to start chat...'}
                                            </p>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="py-10 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-100">
                                        <MessageSquare className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                                        <p className="text-xs text-slate-400 font-bold italic">No active chats</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Referral Card */}
                    {isVendor && (
                        <section className="bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-800 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/10 rounded-full blur-[60px] -mr-10 -mt-10 pointer-events-none" />

                            <div className="relative z-10 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-400 border border-blue-500/10">
                                            <Share2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-white tracking-tight">Refer & Earn</h3>
                                            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mt-0.5">Community Perks</p>
                                        </div>
                                    </div>
                                    <Link href="/affiliate" className="p-2 text-slate-500 hover:text-white transition-colors">
                                        <ChevronRight className="w-5 h-5" />
                                    </Link>
                                </div>

                                {!affiliateStats?.hasRegisteredBusiness && !vendorProfile?.id && !stats?.businessCount && affiliateStats?.hasReferrer && (
                                    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Referred By Affiliate</p>
                                        <p className="text-xs font-bold text-white">{affiliateStats.referrerName || 'Affiliate Partner'}</p>
                                    </div>
                                )}

                                {!affiliateStats?.hasRegisteredBusiness && !vendorProfile?.id && !stats?.businessCount && !affiliateStats?.hasReferrer && (
                                    <div className="space-y-3">
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <input
                                                type="text"
                                                value={referralInput}
                                                onChange={(e) => setReferralInput(e.target.value)}
                                                placeholder="Referral Code"
                                                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-all"
                                            />
                                            <button
                                                onClick={handleApplyReferral}
                                                disabled={isApplying || !referralInput}
                                                className="px-6 py-3 sm:py-0 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-black rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                {isApplying ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Apply'}
                                            </button>
                                        </div>
                                        {applyStatus && (
                                            <p className={`text-[10px] font-black text-center ${applyStatus.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {applyStatus.message}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {affiliateStats?.isAffiliate ? (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl group/link cursor-pointer" onClick={copyReferralLink}>
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="min-w-0">
                                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Your Unique Link</p>
                                                    <p className="text-xs font-bold text-slate-300 truncate tracking-tight">{typeof window !== 'undefined' ? `${window.location.origin}/?ref=${affiliateStats.referralCode}` : 'Loading...'}</p>
                                                </div>
                                                <div className="shrink-0 w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover/link:bg-blue-600 group-hover/link:text-white transition-all ml-auto sm:ml-0">
                                                    {copySuccess ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 px-1">
                                            <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500 shrink-0 mt-0.5">
                                                <Gift className="w-4 h-4" />
                                            </div>
                                            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                                                Invite businesses and get <span className="text-white font-black">10 days free</span> extension for each signup!
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <Link
                                        href="/affiliate"
                                        className="group flex items-center justify-center w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm transition-all active:scale-95 shadow-2xl shadow-blue-900/20"
                                    >
                                        Start Referring <ChevronRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                )}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}
