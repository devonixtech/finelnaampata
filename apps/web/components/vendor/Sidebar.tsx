"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, ListTree, Plus, Heart, Star, Send, Bell,
    Settings, LogOut, ChevronDown, Shield, Phone, Megaphone,
    MessageSquare, TrendingUp, BarChart, CreditCard, Gift,
    UserPlus, Menu, X, Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getImageUrl, api } from '../../lib/api';
import VendorAvatar from '../VendorAvatar';
import { chatApi } from '../../services/chat.service';
import { usePlanFeature, DashboardFeatures } from '../../hooks/usePlanFeature';
import { useSocket } from '../../context/SocketContext';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const { unreadChatCount, unreadCount: unreadNotificationCount, newEnquiryCount } = useSocket();
    const [newBroadcastCount, setNewBroadcastCount] = useState(0);
    const { hasFeature, planName } = usePlanFeature();

    // Close mobile sidebar on route change
    useEffect(() => {
        onClose();
    }, [pathname]);

    // Fetch badge counts & subscription
    useEffect(() => {
        if (!user) return;

        const refreshStats = () => {
            const isVendorOrAdmin = user?.role === 'vendor' || user?.role === 'admin' || user?.role === 'superadmin';
            if (!isVendorOrAdmin) return;

            api.broadcasts.getStats()
                .then((res: any) => setNewBroadcastCount(res?.newCount || 0))
                .catch(() => { });
        };

        refreshStats();
        const interval = setInterval(refreshStats, 30000);
        return () => clearInterval(interval);
    }, [user]);

    const menuItems: { name: string; icon: any; href: string; badge: string | null; feature?: keyof DashboardFeatures; iconColor?: string }[] = [
        { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', badge: null },
        { name: 'My Listings', icon: ListTree, href: '/listings', badge: null, feature: 'showListings' },
        { name: 'Pending Approval', icon: Clock, href: '/pending-listings', badge: null, feature: 'showListings' },
        { name: 'Add Listing', icon: Plus, href: '/add-listing', badge: null, feature: 'canAddListing' },
        { name: 'Leads', icon: Phone, href: '/leads', badge: null, feature: 'showLeads' },
        { name: 'Offers & Events', icon: Megaphone, href: '/offers', badge: null, feature: 'showOffers' },
        { name: 'Reviews', icon: Star, href: '/reviews', badge: null, feature: 'showReviews' },
        { name: 'Analytics', icon: BarChart, href: '/analytics', badge: null, feature: 'showAnalytics' },
        { name: 'Saved', icon: Heart, href: '/saved', badge: null, feature: 'showSaved' },
        { name: 'Following', icon: UserPlus, href: '/following', badge: null, feature: 'showFollowing' },
        { name: 'Queries', icon: Send, href: '/messages', badge: newEnquiryCount > 0 ? String(newEnquiryCount) : null, feature: 'showQueries' },
        { name: 'Live Chat', icon: MessageSquare, iconColor: 'text-emerald-500', href: '/chat', badge: unreadChatCount > 0 ? String(unreadChatCount) : null, feature: 'showChat' },
        { name: 'Hot Demand Insights', icon: TrendingUp, href: '/demand', badge: null, feature: 'showDemand' },
        { name: 'Subscription & Billing', icon: CreditCard, href: '/subscription', badge: null },
        { name: 'Broadcast Feed', icon: Megaphone, href: '/broadcasts', badge: newBroadcastCount > 0 ? String(newBroadcastCount) : null, feature: 'showBroadcast' },
        { name: 'Notifications', icon: Bell, href: '/notifications', badge: unreadNotificationCount > 0 ? String(unreadNotificationCount) : null },
        { name: 'Affiliate', icon: Gift, href: '/affiliate', badge: 'Rewards' },
        { name: 'Settings', icon: Settings, href: '/settings', badge: null },
    ];

    const filteredItems = menuItems.filter(item => {
        // Show all items to admins
        if (user?.role === 'admin' || user?.role === 'superadmin') return true;

        if (user?.role === 'vendor') {
            return true;
        }

        // For regular users/customers, show a limited subset
        return ['Dashboard', 'Live Chat', 'Saved', 'Following', 'Notifications', 'Settings'].includes(item.name);
    });

    const SidebarInner = () => (
        <div className="flex flex-col h-full">
            {/* Brand Logo or User Profile Section */}
            <div className="flex flex-col items-center mb-10 pt-4 px-4">
                <div className="relative mb-5 group cursor-pointer">
                    <div className="absolute inset-0 bg-indigo-500 rounded-[32px] blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
                    <VendorAvatar
                        src={getImageUrl(user?.avatarUrl)}
                        alt={user?.fullName || 'Vendor'}
                        size="lg"
                        className="relative z-10  shadow-indigo-100 transition-all duration-500 group-hover:scale-[1.02] ring-4 ring-white"
                    />

                </div>

                <div className="text-center w-full">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                        <h2 className="text-lg font-black text-slate-900 truncate max-w-[180px] tracking-tight">
                            {user?.fullName?.split(' ')[0] || 'Member'}
                        </h2>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    </div>

                    <div className="flex flex-col items-center gap-1.5">
                        {/* <div className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-xl">
                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.15em] block">
                                {user?.role || 'User'} Account
                            </span>
                        </div> */}
                        {user?.role === 'vendor' && (
                            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-50 rounded-lg border border-indigo-100/50">
                                <TrendingUp className="w-3 h-3 text-indigo-600" />
                                <span className="text-[9px] text-indigo-700 font-bold uppercase tracking-wider">{planName}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-grow space-y-1 overflow-y-auto px-4 custom-scrollbar">
                {filteredItems.map(item => {
                    const isActive = pathname === item.href;
                    const isEnquiries = item.name === 'Queries';
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center justify-between px-4 py-3.5 rounded-2xl group transition-all duration-300 relative overflow-hidden ${isActive
                                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 translate-x-1'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 hover:translate-x-1'
                                }`}
                        >
                            <div className="flex items-center gap-3.5 relative z-10">
                                <item.icon className={`w-5 h-5 transition-all duration-500 ${isActive
                                    ? 'text-white'
                                    : (item as any).iconColor && !isActive
                                        ? `${(item as any).iconColor} group-hover:scale-110`
                                        : 'text-slate-400 group-hover:text-indigo-500 group-hover:scale-110'
                                    }`} />
                                <span className={`text-[13px] tracking-tight transition-all ${isActive ? 'font-black' : 'font-bold'}`}>
                                    {item.name}
                                </span>
                            </div>

                            {item.badge && (
                                <span className={`flex items-center justify-center px-2.5 min-w-[22px] h-5.5 rounded-lg text-[9px] font-black shadow-sm relative z-10 ${isActive
                                    ? 'bg-white/20 text-white backdrop-blur-md'
                                    : isEnquiries
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-[#FF7A30] text-white'
                                    }`}>
                                    {item.badge}
                                </span>
                            )}

                            {isActive && (
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-500 opacity-100" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="mt-auto pt-6 px-4 pb-6">
                <button
                    onClick={logout}
                    className="flex items-center gap-3.5 px-5 py-4 w-full rounded-2xl text-slate-500 hover:text-red-600 hover:bg-red-50/50 transition-all group active:scale-[0.98] border border-transparent hover:border-red-100"
                >
                    <div className="p-2 bg-slate-50 group-hover:bg-red-100/50 rounded-xl transition-colors">
                        <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-600 transition-all" />
                    </div>
                    <span className="font-extrabold text-[13px] tracking-tight">Sign Out</span>
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* ── Mobile backdrop overlay ── */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[40] lg:hidden animate-in fade-in duration-500"
                    onClick={onClose}
                />
            )}

            {/* ── Sidebar (Combined Desktop & Mobile Logic) ── */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-[50] w-72 bg-white border-r border-slate-100
                    transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) lg:relative lg:translate-x-0
                    ${isOpen ? 'translate-x-0 shadow-[20px_0_60px_-15px_rgba(0,0,0,0.1)]' : '-translate-x-full lg:translate-x-0'}
                `}
            >
                <div className="h-full flex flex-col">
                    {/* Close button (Mobile only) */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-[-18px] w-9 h-9 flex lg:hidden items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-500 shadow-xl z-[60] hover:text-indigo-600 transition-all active:scale-90"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <SidebarInner />
                </div>
            </aside>
        </>
    );
}
