"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Bell, User, X, Building2, Users, LayoutGrid, MapPin, Loader2, Command, Check, Trash2 } from 'lucide-react';
import { api, getImageUrl } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminHeader() {
    const { user } = useAuth();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<{
        businesses: any[],
        users: any[],
        categories: any[],
        cities: any[]
    } | null>(null);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showBell, setShowBell] = useState(false);
    const bellRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        try {
            const res = await api.notifications.getAll() as any;
            setNotifications(res.notifications || []);
            setUnreadCount(res.unreadCount || 0);
        } catch { /* ignore */ }
    }, [user]);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
                setShowBell(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleMarkRead = async (id: string) => {
        await api.notifications.markRead(id).catch(() => { });
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleMarkAllRead = async () => {
        await api.notifications.markAllRead().catch(() => { });
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        await api.notifications.delete(id).catch(() => { });
        setNotifications(prev => prev.filter(n => n.id !== id));
        setUnreadCount(prev => {
            const deleted = notifications.find(n => n.id === id);
            return deleted && !deleted.isRead ? Math.max(0, prev - 1) : prev;
        });
    };

    const timeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const m = Math.floor(diff / 60000);
        if (m < 1) return 'just now';
        if (m < 60) return `${m}m ago`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}h ago`;
        return `${Math.floor(h / 24)}d ago`;
    };

    const typeColor: Record<string, string> = {
        new_listing: 'bg-blue-100 text-blue-600',
        enquiry_reply: 'bg-green-100 text-green-700',
        new_vendor: 'bg-purple-100 text-purple-700',
        info: 'bg-slate-100 text-slate-500',
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Keyboard shortcut (CMD/CTRL + K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                const input = document.getElementById('admin-global-search');
                input?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.length >= 2) {
                setIsSearching(true);
                try {
                    const data = await api.admin.globalSearch(searchQuery);
                    setResults(data);
                    setShowResults(true);
                } catch (error) {
                    console.error('Search failed:', error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setResults(null);
                setShowResults(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleResultClick = (href: string) => {
        setShowResults(false);
        setSearchQuery('');
        router.push(href);
    };

    return (
        <header className="h-20 bg-white border-b border-slate-200 sticky top-0 z-50 px-6 lg:px-10 flex items-center justify-between shadow-sm">
            {/* Left: Mobile Sidebar Toggle Placeholder or Logo */}
            <div className="flex items-center gap-4">
                <Link href="/admin" className="flex items-center gap-2 group">
                    <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-200 transition-transform group-hover:scale-105">
                        <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="hidden md:block">
                        <h1 className="text-lg font-black text-slate-900 leading-tight">Admin<span className="text-red-600">Portal</span></h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Management System</p>
                    </div>
                </Link>
            </div>

            {/* Middle: Global Search ("Easy Search") */}
            <div className="flex-1 max-w-2xl px-8 relative" ref={searchRef}>
                <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                        {isSearching ? (
                            <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
                        ) : (
                            <Search className="w-5 h-5 text-slate-400 group-focus-within:text-red-600 transition-colors" />
                        )}
                    </div>
                    <input
                        id="admin-global-search"
                        type="text"
                        placeholder="Search anything... (Ctrl + K)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-12 focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 focus:bg-white transition-all font-medium text-slate-900"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-1.5 py-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                        <Command className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-400">K</span>
                    </div>
                </div>

                {/* Results Dropdown */}
                {showResults && results && (
                    <div className="absolute top-full left-8 right-8 mt-2 bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[100]">
                        <div className="max-h-[70vh] overflow-y-auto p-2">
                            {/* Businesses */}
                            {results.businesses.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                        <Building2 className="w-3 h-3" /> Businesses
                                    </h3>
                                    {results.businesses.map(b => (
                                        <button
                                            key={b.id}
                                            onClick={() => handleResultClick(`/admin/businesses?search=${b.title}`)}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-2xl transition-colors text-left group"
                                        >
                                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                {b.title[0]}
                                            </div>
                                            <div className="flex-1 truncate">
                                                <p className="text-sm font-bold text-slate-900 truncate">{b.title}</p>
                                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                    <MapPin className="w-2.5 h-2.5" /> {b.city}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Users */}
                            {results.users.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                        <Users className="w-3 h-3" /> Users
                                    </h3>
                                    {results.users.map(u => (
                                        <button
                                            key={u.id}
                                            onClick={() => handleResultClick(`/admin/users?search=${u.email}`)}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-2xl transition-colors text-left group"
                                        >
                                            <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-100 flex-shrink-0">
                                                <img src={getImageUrl(u.avatarUrl) || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 truncate">
                                                <p className="text-sm font-bold text-slate-900 truncate">{u.fullName || 'Anonymous'}</p>
                                                <p className="text-[10px] font-medium text-slate-400 truncate">{u.email}</p>
                                            </div>
                                            <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[9px] font-bold text-slate-500 uppercase tracking-widest">{u.role}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Categories & Cities */}
                            <div className="grid grid-cols-2 gap-2">
                                {results.categories.length > 0 && (
                                    <div>
                                        <h3 className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Categories</h3>
                                        {results.categories.map(c => (
                                            <button
                                                key={c.id}
                                                onClick={() => handleResultClick(`/admin/categories?search=${c.name}`)}
                                                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-xl transition-colors text-left"
                                            >
                                                <span className="text-xs font-bold text-slate-700 truncate">{c.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {results.cities.length > 0 && (
                                    <div>
                                        <h3 className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Cities</h3>
                                        {results.cities.map(c => (
                                            <button
                                                key={c.id}
                                                onClick={() => handleResultClick(`/admin/cities?search=${c.name}`)}
                                                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-xl transition-colors text-left"
                                            >
                                                <span className="text-xs font-bold text-slate-700 truncate">{c.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* No results */}
                            {Object.values(results).every(arr => arr.length === 0) && (
                                <div className="py-10 text-center">
                                    <X className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                    <p className="text-sm font-bold text-slate-400">No matches found for "{searchQuery}"</p>
                                </div>
                            )}
                        </div>
                        <div className="bg-slate-50/50 p-3 border-t border-slate-100 flex justify-between items-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Admin Search</p>
                            <span className="text-[10px] font-medium text-slate-500 italic">Showing top results</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Right: Quick Actions */}
            <div className="flex items-center gap-3">
                <div ref={bellRef} className="relative">
                    <button
                        onClick={() => setShowBell(v => !v)}
                        className="p-2.5 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all relative"
                        title="Notifications"
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none border-2 border-white">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {showBell && (
                        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                                <span className="font-bold text-slate-900 text-sm">Notifications</span>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={handleMarkAllRead}
                                        className="text-[11px] font-bold text-red-600 hover:text-red-500 flex items-center gap-1 transition-colors"
                                    >
                                        <Check className="w-3 h-3" /> Mark all read
                                    </button>
                                )}
                            </div>

                            {/* List */}
                            <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                                {notifications.length === 0 ? (
                                    <div className="py-10 text-center">
                                        <Bell className="w-8 h-8 mx-auto text-slate-200 mb-2" />
                                        <p className="text-sm text-slate-400 font-medium">No notifications yet</p>
                                    </div>
                                ) : (
                                    notifications.slice(0, 10).map(n => (
                                        <div
                                            key={n.id}
                                            onClick={() => { if (!n.isRead) handleMarkRead(n.id); }}
                                            className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors group ${n.isRead ? 'opacity-60' : 'bg-red-50/30'
                                                }`}
                                        >
                                            {/* Dot */}
                                            <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${n.isRead ? 'bg-slate-200' : 'bg-red-600'
                                                }`} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${typeColor[n.type] || typeColor.info
                                                        }`}>
                                                        {n.type?.replace(/_/g, ' ')}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-medium ml-auto">{timeAgo(n.createdAt)}</span>
                                                </div>
                                                <p className="text-xs font-bold text-slate-900 leading-snug">{n.title}</p>
                                                <p className="text-[11px] text-slate-500 font-medium mt-0.5 line-clamp-2">{n.message}</p>
                                            </div>
                                            <button
                                                onClick={e => handleDelete(e, n.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 hover:text-red-500 transition-all text-slate-300 flex-shrink-0"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                            
                            {/* Footer */}
                            <div className="border-t border-slate-100 px-4 py-2.5">
                                <Link
                                    href="/admin/notifications"
                                    onClick={() => setShowBell(false)}
                                    className="text-[11px] font-bold text-red-600 hover:text-red-500 transition-colors"
                                >
                                    View all notifications →
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-8 w-px bg-slate-200 mx-2" />

                <div className="flex items-center gap-3 pl-2">
                    <div className="hidden sm:block text-right">
                        <p className="text-sm font-bold text-slate-900 leading-tight">{user?.fullName || 'Super Admin'}</p>
                        <p className="text-[10px] font-bold text-red-600 uppercase tracking-[0.2em]">Full Access</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl border-2 border-white shadow-md overflow-hidden bg-slate-100">
                        <img 
                            src={getImageUrl(user?.avatarUrl) || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                            alt="Avatar" 
                            className="w-full h-full object-cover" 
                        />
                    </div>
                </div>
            </div>
        </header>
    );
}
