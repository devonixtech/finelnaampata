"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    ListTree,
    Settings,
    LogOut,
    ChevronDown,
    ShieldCheck,
    ShieldAlert,
    CreditCard,
    LayoutGrid,
    Activity,
    Receipt,
    MapPin,
    MessageSquare,
    Calendar,
    DollarSign,
    Handshake,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getImageUrl } from '../../lib/api';

interface MenuSection {
    title: string;
    items: {
        name: string;
        icon: any;
        href: string;
        badge: string | null;
    }[];
}

const menuSections: MenuSection[] = [
    {
        title: "MAIN",
        items: [
            { name: 'Overview', icon: LayoutDashboard, href: '/admin', badge: null },
            { name: 'Reports', icon: Activity, href: '/admin/summary-reports', badge: null },
        ]
    },
    {
        title: "DIRECTORY",
        items: [
            { name: 'Businesses', icon: ListTree, href: '/admin/businesses', badge: null },
            { name: 'Categories', icon: LayoutGrid, href: '/admin/categories', badge: null },
            { name: 'Cities', icon: MapPin, href: '/admin/cities', badge: null },
            { name: 'Events & Offers', icon: Calendar, href: '/admin/events-deals', badge: null },
        ]
    },
    {
        title: "USERS & MONETIZATION",
        items: [
            { name: 'Users', icon: Users, href: '/admin/users', badge: null },
            { name: 'Plans', icon: CreditCard, href: '/admin/plans', badge: null },
            { name: 'Subscriptions', icon: Receipt, href: '/admin/subscriptions', badge: null },
            { name: 'Affiliates', icon: Handshake, href: '/admin/affiliates', badge: null },
            { name: 'KYC Reviews', icon: ShieldCheck, href: '/admin/affiliates/kyc', badge: null },
            { name: 'Payout Requests', icon: Receipt, href: '/admin/affiliates/payouts', badge: null },
            { name: 'Referrals', icon: Users, href: '/admin/referrals', badge: null },
        ]
    },
    {
        title: "MODERATION",
        items: [
            { name: 'Moderation Hub', icon: ShieldAlert, href: '/admin/reports', badge: null },
            { name: 'Review Moderation', icon: ShieldAlert, href: '/admin/reviews', badge: null },
            { name: 'Q&A Moderation', icon: MessageSquare, href: '/admin/qa', badge: null },
        ]
    },
    {
        title: "ANALYTICS",
        items: [
            { name: 'Demand Insights', icon: Activity, href: '/admin/demand', badge: null },
            { name: 'Search Analytics', icon: Activity, href: '/admin/analytics', badge: null },
            { name: 'Vendor Analytics', icon: Users, href: '/admin/analytics/vendors', badge: null },
            { name: 'Revenue Tracking', icon: DollarSign, href: '/admin/analytics/revenue', badge: null },
            { name: 'Live Activity', icon: Activity, href: '/admin/analytics/activity', badge: null },
        ]
    },
    {
        title: "SYSTEM",
        items: [
            { name: 'Geo Correction', icon: MapPin, href: '/admin/geo', badge: null },
            { name: 'Settings', icon: Settings, href: '/admin/settings', badge: null },
        ]
    }
];

export default function AdminSidebar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    return (
        <aside className="w-72 bg-[#F8FAFC] border-r border-slate-200 h-[calc(100vh-80px)] sticky top-20 flex flex-col p-6 overflow-y-auto hidden lg:flex custom-scrollbar">
            {/* Profile Info */}
            <div className="flex flex-col items-center mb-8 pt-2 shrink-0">
                <div className="relative mb-4 group cursor-pointer">
                    <div className="w-20 h-20 rounded-[20px] overflow-hidden border-4 border-white shadow-2xl transition-transform duration-500 group-hover:scale-105">
                        <img
                            src={getImageUrl(user?.avatarUrl) || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-red-600 rounded-xl border-4 border-[#F8FAFC] flex items-center justify-center text-white shadow-lg">
                        <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                </div>

                <div className="text-center w-full">
                    <button className="flex items-center justify-center gap-1 mx-auto mb-1 group">
                        <span className="text-lg font-black text-slate-900 group-hover:text-red-600 transition-colors">
                            {user?.fullName || 'Admin'}
                        </span>
                        <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-red-600 transition-transform group-hover:translate-y-0.5" />
                    </button>
                    <div className="flex items-center justify-center gap-1.5 px-3 py-0.5 bg-red-50/50 rounded-full w-fit mx-auto border border-red-100/50">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-[9px] text-red-600 font-bold uppercase tracking-widest">{user?.role || 'administrator'}</span>
                    </div>
                </div>
            </div>

            {/* Navigation Sections */}
            <nav className="flex-grow space-y-6">
                {menuSections.map((section) => (
                    <div key={section.title} className="space-y-1.5">
                        <p className="px-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                            {section.title}
                        </p>
                        <div className="space-y-1">
                            {section.items.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`flex items-center justify-between px-4 py-3 rounded-2xl group transition-all duration-200 ${isActive
                                            ? 'bg-white text-slate-900 shadow-md shadow-slate-200/50 font-black translate-x-1 border border-slate-100'
                                            : 'text-slate-500 hover:text-slate-900 hover:bg-white/70 font-bold'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <item.icon className={`w-4 h-4 transition-all duration-300 ${isActive ? 'text-red-600 scale-110' : 'text-slate-400 group-hover:text-slate-900 group-hover:scale-110'
                                                }`} />
                                            <span className="text-sm tracking-tight">{item.name}</span>
                                        </div>
                                        {item.badge && (
                                            <span className="flex items-center justify-center px-2 min-w-[20px] h-5 rounded-lg bg-red-500 text-white text-[9px] font-black shadow-md shadow-red-500/20">
                                                {item.badge}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Logout Action */}
            <div className="mt-8 pt-4 border-t border-slate-200/60 shrink-0">
                <button
                    onClick={logout}
                    className="flex items-center gap-3.5 px-4 py-3.5 w-full rounded-2xl text-slate-500 hover:text-red-600 hover:bg-red-50/50 transition-all group active:scale-95 border border-transparent hover:border-red-100"
                >
                    <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-600 group-hover:-translate-x-1 transition-all" />
                    <span className="font-extrabold text-sm tracking-tight">Log Out</span>
                </button>
            </div>
        </aside>
    );
}
