"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    ListTree,
    CheckCircle,
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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getImageUrl } from '../../lib/api';


const menuItems = [
    { name: 'Overview', icon: LayoutDashboard, href: '/admin', badge: null },
    { name: 'Reports', icon: Activity, href: '/admin/summary-reports', badge: null },
    { name: 'Users', icon: Users, href: '/admin/users', badge: null },
    { name: 'Categories', icon: LayoutGrid, href: '/admin/categories', badge: null },
    { name: 'Cities', icon: MapPin, href: '/admin/cities', badge: null },
    { name: 'Businesses', icon: ListTree, href: '/admin/businesses', badge: null },
    { name: 'Moderation Hub', icon: ShieldAlert, href: '/admin/reports', badge: 'New' },
    { name: 'Listings Approval', icon: ShieldAlert, href: '/admin/listings', badge: null },
    { name: 'Plans', icon: CreditCard, href: '/admin/plans', badge: null },
    { name: 'Subscriptions', icon: Receipt, href: '/admin/subscriptions', badge: null },
    { name: 'Demand Insights', icon: Activity, href: '/admin/demand', badge: null },
    { name: 'Search Analytics', icon: Activity, href: '/admin/analytics', badge: null },
    { name: 'Search Heatmap', icon: ShieldCheck, href: '/admin/heatmap', badge: null },
    { name: 'Review Moderation', icon: ShieldAlert, href: '/admin/reviews', badge: null },
    { name: 'Q&A Moderation', icon: MessageSquare, href: '/admin/qa', badge: null },
    // Promotion/boost menu intentionally removed per monetization policy.
    { name: 'Referrals', icon: Users, href: '/admin/referrals', badge: null },
    { name: 'Settings', icon: Settings, href: '/admin/settings', badge: null },
];


export default function AdminSidebar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    return (
        <aside className="w-72 bg-[#F8FAFC] border-r border-slate-200 h-[calc(100vh-80px)] sticky top-20 flex flex-col p-6 overflow-y-auto hidden lg:flex">
            {/* Profile Info */}
            <div className="flex flex-col items-center mb-10 pt-4">
                <div className="relative mb-4 group cursor-pointer">
                    <div className="w-24 h-24 rounded-[20px] overflow-hidden border-4 border-white shadow-2xl transition-transform duration-500 group-hover:scale-105">
                        <img
                            src={getImageUrl(user?.avatarUrl) || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-red-600 rounded-xl border-4 border-[#F8FAFC] flex items-center justify-center text-white shadow-lg">
                        <ShieldCheck className="w-4 h-4" />
                    </div>
                </div>

                <div className="text-center w-full">
                    <button className="flex items-center justify-center gap-1 mx-auto mb-1 group">
                        <span className="text-xl font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                            {user?.fullName || 'Admin'}
                        </span>
                        <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-red-600 transition-transform group-hover:translate-y-0.5" />
                    </button>
                    <div className="flex items-center justify-center gap-1.5 px-3 py-1 bg-red-50/50 rounded-full w-fit mx-auto border border-red-100/50">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-[9px] text-red-600 font-bold uppercase tracking-widest">{user?.role || 'administrator'}</span>
                    </div>
                </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-grow space-y-2">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center justify-between px-5 py-4 rounded-[3px] group transition-all duration-300 ${isActive
                                ? 'bg-white text-slate-900  shadow-slate-200/40 translate-x-1'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <item.icon className={`w-5 h-5 transition-all duration-300 ${isActive ? 'text-red-600 scale-110' : 'text-slate-400 group-hover:text-slate-900 group-hover:scale-110'
                                    }`} />
                                <span className={`text-[15px] tracking-tight transition-all ${isActive ? 'font-bold' : 'font-bold'}`}>{item.name}</span>
                            </div>
                            {item.badge && (
                                <span className="flex items-center justify-center px-2 min-w-[20px] h-5 rounded-lg bg-red-500 text-white text-[10px] font-bold shadow-lg shadow-red-500/20">
                                    {item.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout Action */}
            <div className="mt-10 pt-6 border-t border-slate-200/60">
                <button
                    onClick={logout}
                    className="flex items-center gap-4 px-5 py-4 w-full rounded-[3px] text-slate-500 hover:text-red-500 hover:bg-red-50/50 transition-all group active:scale-95"
                >
                    <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-500 group-hover:-translate-x-1 transition-all" />
                    <span className="font-bold text-[15px] tracking-tight">Log Out</span>
                </button>
            </div>
        </aside>
    );
}
