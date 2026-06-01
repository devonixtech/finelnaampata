"use client";

import React, { useState, useEffect } from 'react';
import { Menu, Bell, Search, User, LogOut, MessageSquare, Shield, ChevronDown, Building2, Globe, Megaphone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import VendorAvatar from '../VendorAvatar';
import { api } from '../../lib/api';
import { Category, City } from '../../types/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../../context/SocketContext';

interface DashboardHeaderProps {
    toggleSidebar: () => void;
    unreadNotifications?: number;
    unreadMessages?: number;
}

export default function DashboardHeader({ toggleSidebar, unreadNotifications: propUnreadNotifs, unreadMessages: propUnreadMessages }: DashboardHeaderProps) {
    const { user } = useAuth();
    const { unreadChatCount, unreadCount: unreadNotificationCount } = useSocket();

    // Use socket counts if available, otherwise fallback to props
    const unreadMessages = propUnreadMessages !== undefined ? propUnreadMessages : unreadChatCount;
    const unreadNotifications = propUnreadNotifs !== undefined ? propUnreadNotifs : unreadNotificationCount;

    const [categories, setCategories] = useState<Category[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [cats, cityData] = await Promise.all([
                    api.categories.getPopular(10),
                    api.cities.getPopular()
                ]);
                setCategories(cats.slice(0, 10));
                setCities(cityData.slice(0, 10));
            } catch (error) {
                console.error('Error fetching dashboard nav data:', error);
            }
        };
        fetchData();
    }, []);

    const handleDropdownToggle = (name: string) => {
        setActiveDropdown(activeDropdown === name ? null : name);
    };

    return (
        <header className="sticky top-0 z-30 py-4 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                <div className="bg-white/80 border border-slate-100/60 backdrop-blur-xl rounded-[24px] h-20 shadow-sm flex items-center justify-between px-6 transition-all">
                    <div className="flex items-center gap-6">
                        {/* Mobile Hamburger */}
                        <button
                            onClick={toggleSidebar}
                            className="p-2.5 -ml-2 bg-white border border-slate-100 text-slate-600 hover:text-slate-900 hover:shadow-sm rounded-xl lg:hidden transition-all active:scale-90"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        {/* <div className="hidden lg:flex items-center gap-6">
                            <div className="flex flex-col">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-1.5 ml-0.5">System Status</p>
                                <div className="flex items-center gap-2.5 px-3.5 py-1.5 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 hover:bg-emerald-50 transition-colors cursor-default">
                                    <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-widest">Global Network Online</span>
                                </div>
                            </div>
                        </div> */}
                    </div>

                    {/* Centered Navigation */}
                    <div className="hidden md:flex flex-1 justify-center mx-8">
                        <nav className="flex items-center gap-2">
                            <Link href="/" className="text-sm font-medium text-[#70757a] hover:bg-gray-100 px-4 py-2 rounded-md transition-colors">
                                Home
                            </Link>


                            <div
                                className="relative group"
                                onMouseEnter={() => setActiveDropdown('categories')}
                                onMouseLeave={() => setActiveDropdown(null)}
                            >
                                <button
                                    onClick={() => handleDropdownToggle('categories')}
                                    className="flex items-center gap-1 text-sm font-medium text-[#70757a] hover:bg-gray-100 px-4 py-2 rounded-md transition-colors group"
                                >
                                    Categories <ChevronDown className={`w-3 h-3 opacity-60 transition-transform duration-300 ${activeDropdown === 'categories' ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {activeDropdown === 'categories' && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute top-full left-1/2 -translate-x-1/2 pt-4 w-[600px] z-50"
                                        >
                                            <div className="bg-white rounded-[24px] shadow-2xl border border-slate-100 p-6">
                                                <div className="flex items-center justify-between mb-6">
                                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Popular Categories</h3>
                                                    <Link href="/categories" className="text-[10px] font-black uppercase tracking-widest text-[#FF7A30] hover:underline" onClick={() => setActiveDropdown(null)}>View All →</Link>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {categories.map((cat) => (
                                                        <Link
                                                            key={cat.id}
                                                            href={`/categories/${cat.slug}`}
                                                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all group/item"
                                                            onClick={() => setActiveDropdown(null)}
                                                        >
                                                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 group-hover/item:bg-blue-500 group-hover/item:text-white transition-colors">
                                                                <Search className="w-4 h-4" />
                                                            </div>
                                                            <span className="text-sm font-bold text-slate-600 group-hover/item:text-slate-900">
                                                                {cat.name}
                                                            </span>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>


                            <div
                                className="relative group"
                                onMouseEnter={() => setActiveDropdown('businesses')}
                                onMouseLeave={() => setActiveDropdown(null)}
                            >
                                <button
                                    onClick={() => handleDropdownToggle('businesses')}
                                    className="flex items-center gap-1 text-sm font-medium text-[#70757a] hover:bg-gray-100 px-4 py-2 rounded-md transition-colors group"
                                >
                                    Businesses <ChevronDown className={`w-3 h-3 opacity-60 transition-transform duration-300 ${activeDropdown === 'businesses' ? 'rotate-180' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {activeDropdown === 'businesses' && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute top-full left-1/2 -translate-x-1/2 pt-4 w-64 z-50"
                                        >
                                            <div className="bg-white rounded-[24px] shadow-2xl border border-slate-100 p-3">
                                                <div className="flex flex-col gap-1">
                                                    <Link href="/search?filter=featured" onClick={() => setActiveDropdown(null)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all group/item">
                                                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-[#FF7A30]">
                                                            <Building2 className="w-4 h-4" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-slate-900">Featured</span>
                                                            <span className="text-[10px] text-slate-400 font-medium">Hand-picked best locals</span>
                                                        </div>
                                                    </Link>
                                                    <Link href="/search?filter=new" onClick={() => setActiveDropdown(null)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all group/item">
                                                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                                                            <Search className="w-4 h-4" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-slate-900">New Listings</span>
                                                            <span className="text-[10px] text-slate-400 font-medium">Fresh arrivals</span>
                                                        </div>
                                                    </Link>
                                                    <Link href="/offers-events" onClick={() => setActiveDropdown(null)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all group/item">
                                                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                                                            <Megaphone className="w-4 h-4" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-slate-900">Offer & Events</span>
                                                            <span className="text-[10px] text-slate-400 font-medium">Best deals</span>
                                                        </div>
                                                    </Link>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>


                            <div
                                className="relative group"
                                onMouseEnter={() => setActiveDropdown('cities')}
                                onMouseLeave={() => setActiveDropdown(null)}
                            >
                                <button
                                    onClick={() => handleDropdownToggle('cities')}
                                    className="flex items-center gap-1 text-sm font-medium text-[#70757a] hover:bg-gray-100 px-4 py-2 rounded-md transition-colors group"
                                >
                                    Cities <ChevronDown className={`w-3 h-3 opacity-60 transition-transform duration-300 ${activeDropdown === 'cities' ? 'rotate-180' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {activeDropdown === 'cities' && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute top-full left-1/2 -translate-x-1/2 pt-4 w-[600px] z-50"
                                        >
                                            <div className="bg-white rounded-[24px] shadow-2xl border border-slate-100 p-6">
                                                <div className="flex items-center justify-between mb-6">
                                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Popular Cities</h3>
                                                    <Link href="/cities" className="text-[10px] font-black uppercase tracking-widest text-[#FF7A30] hover:underline" onClick={() => setActiveDropdown(null)}>Browse All →</Link>
                                                </div>
                                                <div className="grid grid-cols-3 gap-3">
                                                    {cities.map((city) => (
                                                        <Link
                                                            key={city.id}
                                                            href={`/cities/${encodeURIComponent(city.name.toLowerCase())}`}
                                                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all group/item"
                                                            onClick={() => setActiveDropdown(null)}
                                                        >
                                                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover/item:bg-emerald-500 group-hover/item:text-white transition-colors">
                                                                <Globe className="w-4 h-4" />
                                                            </div>
                                                            <span className="text-sm font-bold text-slate-600 group-hover/item:text-slate-900">
                                                                {city.name}
                                                            </span>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </nav>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-8">
                        {user?.role === 'user' && (
                            <Link href="/upgrade" className="hidden sm:inline-block px-4 py-2 rounded-xl bg-[#FF7A30] text-white font-bold text-xs hover:bg-[#E86920] transition-all whitespace-nowrap">
                                List My Business
                            </Link>
                        )}


                        <div className="flex items-center gap-2 sm:gap-4">
                            {/* Chat */}
                            <Link
                                href="/chat"
                                className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-xl transition-all relative group"
                            >
                                <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                {unreadMessages > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white text-[10px] font-black rounded-lg flex items-center justify-center border-2 border-white shadow-xl shadow-indigo-200">
                                        {unreadMessages > 9 ? '9+' : unreadMessages}
                                    </span>
                                )}
                            </Link>

                            {/* Notifications */}
                            <Link
                                href="/notifications"
                                className="p-2.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50/50 rounded-xl transition-all relative group"
                            >
                                <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                {unreadNotifications > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF7A30] text-white text-[10px] font-black rounded-lg flex items-center justify-center border-2 border-white shadow-xl shadow-orange-200">
                                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                                    </span>
                                )}
                            </Link>
                        </div>

                        <div className="h-8 w-px bg-slate-200/60 mx-1 hidden sm:block" />

                        {/* User Dropdown / Profile */}
                        <div className="relative group/user">
                            <button
                                className="flex items-center gap-3 sm:gap-4 cursor-pointer pl-2 hover:bg-slate-50/50 p-2 rounded-2xl transition-all"
                            >
                                {/* Text */}
                                <div className="hidden sm:flex flex-col items-end leading-tight">
                                    <span className="text-sm font-bold text-slate-900 group-hover/user:text-indigo-600 transition-colors">
                                        {user?.fullName?.split(' ')[0] || 'User'}
                                    </span>


                                </div>

                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-white shadow-sm flex items-center justify-center bg-slate-100 group-hover/user:ring-indigo-100 transition-all">
                                    <VendorAvatar
                                        src={user?.avatarUrl}
                                        alt={user?.fullName || 'User'}
                                        size="sm"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            <div className="absolute right-0 mt-3 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/50 opacity-0 invisible group-hover/user:opacity-100 group-hover/user:visible transition-all duration-200 z-50 transform origin-top-right group-hover/user:translate-y-0 translate-y-2">
                                <div className="p-3 border-b border-slate-50">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 px-2">Account</p>
                                    <div className="flex items-center gap-3 p-2">
                                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100">
                                            <VendorAvatar src={user?.avatarUrl} alt={user?.fullName} size="sm" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-900 truncate max-w-[120px]">{user?.fullName}</span>
                                            <span className="text-[10px] text-slate-500 truncate max-w-[120px]">{user?.email}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-2">
                                    <Link
                                        href="/settings"
                                        className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-xl transition-all"
                                    >
                                        <User className="w-4 h-4" />
                                        <span>My Profile</span>
                                    </Link>
                                    <button
                                        onClick={() => {
                                            localStorage.removeItem('token');
                                            localStorage.removeItem('user');
                                            window.location.href = '/login';
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all mt-1"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
