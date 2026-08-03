"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
    Activity,
    RefreshCcw,
    ChevronLeft,
    Users,
    Eye,
    MessageSquare,
    Star,
    CreditCard,
    UserPlus,
    Store,
    Clock,
    Zap,
    Search,
} from 'lucide-react';
import { api } from '../../../../lib/api';
import { io, Socket } from 'socket.io-client';
import { formatDistanceToNow } from 'date-fns';

interface ActivityEvent {
    id: string;
    type: string;
    message: string;
    timestamp: string;
    userId?: string;
    userName?: string;
    businessName?: string;
    metadata?: any;
}

const EVENT_ICONS: Record<string, any> = {
    user_registered: UserPlus,
    business_created: Store,
    review_posted: Star,
    subscription_purchased: CreditCard,
    enquiry_submitted: MessageSquare,
    profile_viewed: Eye,
    broadcast_responded: MessageSquare,
    default: Activity,
};

const EVENT_COLORS: Record<string, string> = {
    user_registered: 'bg-blue-100 text-blue-600',
    business_created: 'bg-emerald-100 text-emerald-600',
    review_posted: 'bg-amber-100 text-amber-600',
    subscription_purchased: 'bg-violet-100 text-violet-600',
    enquiry_submitted: 'bg-pink-100 text-pink-600',
    profile_viewed: 'bg-slate-100 text-slate-600',
    broadcast_responded: 'bg-orange-100 text-orange-600',
    default: 'bg-slate-100 text-slate-500',
};

export default function AdminActivityPage() {
    const [events, setEvents] = useState<ActivityEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [connected, setConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const [realtimeEvents, setRealtimeEvents] = useState<ActivityEvent[]>([]);

    const fetchActivity = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.admin.activityFeed(100);
            setEvents(data || []);
        } catch (err) {
            console.error('Failed to fetch activity:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchActivity();

        // Connect to real-time activity socket
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            const socket = io(typeof window !== 'undefined' && window.location.hostname === 'localhost'
                ? 'http://localhost:3001'
                : 'https://local-business-listing-directory-production.up.railway.app', {
                path: '/socket.io',
                auth: { token },
                transports: ['websocket', 'polling'],
            });

            socket.on('connect', () => {
                setConnected(true);
                socket.emit('join_admin_dashboard');
            });

            socket.on('activity_event', (event: ActivityEvent) => {
                setRealtimeEvents(prev => [event, ...prev].slice(0, 50));
            });

            socket.on('disconnect', () => setConnected(false));
            socketRef.current = socket;

            return () => {
                socket.disconnect();
            };
        } catch (err) {
            console.log('Socket connection skipped (SSR)');
        }
    }, [fetchActivity]);

    const allEvents = [...realtimeEvents, ...events];
    const filtered = allEvents.filter(e => {
        const matchesFilter = filter === 'all' || e.type === filter;
        const matchesSearch = !search ||
            e.message?.toLowerCase().includes(search.toLowerCase()) ||
            e.userName?.toLowerCase().includes(search.toLowerCase()) ||
            e.businessName?.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const eventCounts = allEvents.reduce((acc: Record<string, number>, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1;
        return acc;
    }, {});

    const getIcon = (type: string) => EVENT_ICONS[type] || EVENT_ICONS.default;
    const getColor = (type: string) => EVENT_COLORS[type] || EVENT_COLORS.default;

    return (
        <div className="space-y-7 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                    <Link href="/admin/analytics" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors mb-3">
                        <ChevronLeft className="w-3 h-3" /> Back to Analytics
                    </Link>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-1">
                        Real-Time <span className="bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">Activity</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-sm">Monitor live platform activity and user interactions.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${connected ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                        <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                        {connected ? 'Live' : 'Offline'}
                    </div>
                    <button
                        onClick={fetchActivity}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
                    >
                        <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Users Registered', value: eventCounts['user_registered'] || 0, icon: UserPlus, color: 'bg-blue-100', textColor: 'text-blue-600' },
                    { label: 'Businesses Created', value: eventCounts['business_created'] || 0, icon: Store, color: 'bg-emerald-100', textColor: 'text-emerald-600' },
                    { label: 'Reviews Posted', value: eventCounts['review_posted'] || 0, icon: Star, color: 'bg-amber-100', textColor: 'text-amber-600' },
                    { label: 'Subscriptions', value: eventCounts['subscription_purchased'] || 0, icon: CreditCard, color: 'bg-violet-100', textColor: 'text-violet-600' },
                ].map(stat => (
                    <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm">
                        <div className={`w-11 h-11 ${stat.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                            <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900 leading-none">{stat.value}</p>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white border border-slate-100 rounded-2xl p-3.5 shadow-sm flex flex-wrap items-center gap-3">
                <div className="relative flex-grow min-w-[180px]">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search activity..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    {[
                        { value: 'all', label: 'All' },
                        { value: 'user_registered', label: 'Users' },
                        { value: 'business_created', label: 'Businesses' },
                        { value: 'review_posted', label: 'Reviews' },
                        { value: 'subscription_purchased', label: 'Payments' },
                        { value: 'enquiry_submitted', label: 'Enquiries' },
                    ].map(f => (
                        <button
                            key={f.value}
                            onClick={() => setFilter(f.value)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                                filter === f.value
                                    ? 'bg-slate-900 text-white border-slate-900'
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                <span className="ml-auto text-xs font-bold text-slate-400">{filtered.length} events</span>
            </div>

            {/* Activity Feed */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {loading && events.length === 0 ? (
                    <div className="p-8 space-y-4">
                        {Array(5).fill(0).map((_, i) => (
                            <div key={i} className="flex items-center gap-4 animate-pulse">
                                <div className="w-10 h-10 bg-slate-100 rounded-xl" />
                                <div className="flex-grow space-y-2">
                                    <div className="h-3 w-48 bg-slate-100 rounded-full" />
                                    <div className="h-2.5 w-24 bg-slate-100 rounded-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 text-center">
                        <Activity className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="font-bold text-slate-900">No activity yet</p>
                        <p className="text-xs text-slate-400 mt-1">Events will appear here in real-time.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto custom-scrollbar">
                        {filtered.map((event, idx) => {
                            const Icon = getIcon(event.type);
                            const colorClass = getColor(event.type);
                            const isNew = idx < realtimeEvents.length;
                            return (
                                <div
                                    key={event.id || `evt-${idx}`}
                                    className={`flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-all ${isNew ? 'bg-blue-50/30' : ''}`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                                        <Icon className="w-4.5 h-4.5" />
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <p className="text-sm font-bold text-slate-800 truncate">{event.message}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {event.userName && (
                                                <span className="text-[10px] font-bold text-slate-400">{event.userName}</span>
                                            )}
                                            <span className="text-[10px] text-slate-300">·</span>
                                            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                                <Clock className="w-2.5 h-2.5" />
                                                {event.timestamp
                                                    ? formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })
                                                    : 'just now'
                                                }
                                            </span>
                                        </div>
                                    </div>
                                    {isNew && (
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-wide">New</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
