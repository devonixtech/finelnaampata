"use client";

import React, { useState, useEffect } from 'react';
import {
    Users,
    TrendingUp,
    Briefcase,
    MessageSquare,
    ShieldAlert,
    Calendar,
    Tag,
} from 'lucide-react';
import { api } from '../../lib/api';
import StatsGrid from '../../components/business/StatsGrid';
import Link from 'next/link';

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const statsData = await api.admin.getStats();
            setStats(statsData);
        } catch (err) {
            console.error('Failed to fetch admin data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const mappedStats = [
        {
            label: 'Total Users',
            value: stats?.totalUsers || '0',
            icon: Users,
            color: 'bg-gradient-to-br from-[#EE4444] to-[#CC2222] text-white',
            shadow: 'shadow-red-500/20'
        },
        {
            label: 'Total Businesses',
            value: stats?.totalBusinesses || '0',
            icon: Briefcase,
            color: 'bg-gradient-to-br from-[#3366CC] to-[#1144AA]',
            shadow: 'shadow-blue-500/20'
        },
        {
            label: 'Total Events',
            value: stats?.totalEvents || '0',
            icon: Calendar,
            color: 'bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9]',
            shadow: 'shadow-purple-500/20'
        },
        {
            label: 'Total Deals',
            value: stats?.totalDeals || '0',
            icon: Tag,
            color: 'bg-gradient-to-br from-[#EC4899] to-[#BE185D]',
            shadow: 'shadow-pink-500/20'
        },
        {
            label: 'Total Reviews',
            value: stats?.totalReviews || '0',
            icon: MessageSquare,
            color: 'bg-gradient-to-br from-[#33AA88] to-[#118866]',
            shadow: 'shadow-emerald-500/20'
        },
        {
            label: 'Active Subscriptions',
            value: stats?.activeSubscriptions || '0',
            icon: TrendingUp,
            color: 'bg-gradient-to-br from-[#FFAA33] to-[#FF8811]',
            shadow: 'shadow-orange-500/20'
        },
    ];

    if (loading) return <div className="p-10 text-slate-400 font-bold uppercase tracking-widest text-center">Loading Admin Dashboard...</div>;

    return (
        <div className="space-y-12 pb-20">
            {/* Admin Header */}
            <div>
                <h1 className="text-4xl lg:text-5xl font-black text-slate-900 mb-3 tracking-tight">System Administration</h1>
                <p className="text-slate-400 font-bold tracking-tight text-lg">Manage users, businesses, and platform health.</p>
            </div>

            {/* Global Stats */}
            <StatsGrid stats={mappedStats} />

            <div>
                {/* System Tasks Placeholder */}
                <div className="bg-slate-900 rounded-[16px] p-8 text-white shadow-2xl shadow-red-500/10">
                    <h3 className="text-2xl font-black mb-8 tracking-tight text-white">Critical Actions</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <Link href="/admin/reports" className="w-full p-6 bg-white/5 rounded-3xl flex items-center gap-4 hover:bg-white/10 transition-all text-left block">
                            <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center">
                                <ShieldAlert className="w-6 h-6 text-red-500" />
                            </div>
                            <div>
                                <p className="font-bold text-white">Moderate Reported Content</p>
                                <p className="text-xs text-slate-400">Manage community reports</p>
                            </div>
                        </Link>
                        <Link href="/admin/qa" className="w-full p-6 bg-white/5 rounded-3xl flex items-center gap-4 hover:bg-white/10 transition-all text-left block">
                            <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center">
                                <MessageSquare className="w-6 h-6 text-amber-500" />
                            </div>
                            <div>
                                <p className="font-bold text-white">Q&A Moderation</p>
                                <p className="text-xs text-slate-400">Review pending community questions</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
