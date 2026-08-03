"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import {
    Search,
    TrendingUp,
    MapPin,
    Calendar,
    Users,
    Activity,
    AlertTriangle,
    BarChart3,
    Table as TableIcon,
    DollarSign,
    Zap,
    ArrowUpRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend
} from 'recharts';

export default function SearchAnalyticsPage() {
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [city, setCity] = useState('');

    const [overview, setOverview] = useState({
        totalSearches: 0,
        uniqueUsers: 0,
        noResultSearches: 0,
        avgSearchPerUser: 0
    });
    const [topKeywords, setTopKeywords] = useState<any[]>([]);
    const [topCities, setTopCities] = useState<any[]>([]);
    const [noResults, setNoResults] = useState<any[]>([]);
    const [trends, setTrends] = useState<any[]>([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = {
                ...(startDate && { startDate }),
                ...(endDate && { endDate }),
                ...(city && { city })
            };

            const [
                overviewData,
                keywordsData,
                citiesData,
                noResultsData,
                trendsData
            ] = await Promise.all([
                api.admin.searchAnalytics.getOverview(params),
                api.admin.searchAnalytics.getTopKeywords({ ...params, limit: 10 }),
                api.admin.searchAnalytics.getTopCities({ ...params, limit: 10 }),
                api.admin.searchAnalytics.getNoResults({ ...params, limit: 10 }),
                api.admin.searchAnalytics.getTrends(params)
            ]);

            setOverview({
                totalSearches: overviewData.totalSearches || 0,
                uniqueUsers: overviewData.uniqueUsers || 0,
                noResultSearches: overviewData.noResultSearches || 0,
                avgSearchPerUser: Number(overviewData.avgSearchPerUser || 0).toFixed(2) as any
            });

            setTopKeywords(keywordsData || []);
            setTopCities(citiesData || []);
            setNoResults(noResultsData || []);
            
            // Format trends data for the chart
            const formattedTrends = (trendsData || []).map((t: any) => ({
                date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                count: parseInt(t.count)
            }));
            
            setTrends(formattedTrends);
        } catch (error) {
            console.error('Failed to fetch search analytics data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        fetchData();
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
                        Search <span className="text-red-600">Analytics</span>
                    </h1>
                    <p className="text-slate-500 font-medium flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        Monitor user search behavior, identify demand trends, and uncover gaps.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Quick Links to Revenue & Activity */}
                    <Link
                        href="/admin/analytics/revenue"
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <DollarSign className="w-4 h-4 text-emerald-500" /> Revenue
                        <ArrowUpRight className="w-3 h-3 text-slate-400" />
                    </Link>
                    <Link
                        href="/admin/analytics/activity"
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <Zap className="w-4 h-4 text-blue-500" /> Live Activity
                        <ArrowUpRight className="w-3 h-3 text-slate-400" />
                    </Link>
                </div>
            </div>

            <form onSubmit={handleFilter} className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
                    <div className="flex items-center gap-2 pl-4 border-r border-slate-100 pr-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">From</span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-sm font-bold outline-none text-slate-700 p-0"
                        />
                    </div>
                    <div className="flex items-center gap-2 pl-2 pr-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">To</span>
                        <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-transparent border-none focus:ring-0 text-sm font-bold outline-none text-slate-700 p-0"
                            />
                        </div>
                    </div>

                    <div className="relative group flex-grow lg:flex-grow-0">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Filter by city..."
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl w-full lg:w-48 focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-medium text-sm"
                        />
                    </div>
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 flex items-center justify-center bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-red-200"
                    >
                        {loading ? 'Applying...' : 'Apply Filters'}
                    </button>
                </form>

            {/* Quick Stats (Overview) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Searches', value: overview.totalSearches, icon: Search, color: 'bg-blue-500', trend: '+12%' },
                    { label: 'Unique Users', value: overview.uniqueUsers, icon: Users, color: 'bg-indigo-500', trend: '+5%' },
                    { label: 'No Results', value: overview.noResultSearches, icon: AlertTriangle, color: 'bg-orange-500', trend: '-2%' },
                    { label: 'Avg Searches/User', value: overview.avgSearchPerUser, icon: Activity, color: 'bg-emerald-500', trend: '+1.5' },
                ].map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i}
                        className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex flex-col gap-4 relative overflow-hidden"
                    >
                        <div className="flex items-center justify-between">
                            <div className={`${stat.color} p-3 rounded-2xl text-white shadow-lg`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900 mb-1">{stat.value}</p>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Search Trends Line Chart */}
                <div className="lg:col-span-2 bg-white rounded-[24px] border border-slate-100 shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-red-600" />
                            Search Volume Trends
                        </h2>
                    </div>
                    <div className="h-[300px] w-full">
                        {loading ? (
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="w-8 h-8 border-4 border-slate-200 border-t-red-600 rounded-full animate-spin"></div>
                            </div>
                        ) : trends.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trends} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="count" 
                                        name="Searches"
                                        stroke="#dc2626" 
                                        strokeWidth={3}
                                        dot={{ r: 4, strokeWidth: 2 }}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium">
                                No data available for this period.
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Cities List */}
                <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6 flex flex-col">
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-6">
                        <MapPin className="w-5 h-5 text-red-600" />
                        Top Cities
                    </h2>
                    
                    {loading ? (
                         <div className="flex-grow flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-slate-200 border-t-red-600 rounded-full animate-spin"></div>
                        </div>
                    ) : topCities.length > 0 ? (
                        <div className="space-y-4">
                            {topCities.map((c, i) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-xs font-black text-slate-500 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                                            {i + 1}
                                        </div>
                                        <span className="font-bold text-slate-700">{c.city}</span>
                                    </div>
                                    <span className="text-sm font-black text-slate-900 bg-slate-50 px-3 py-1 rounded-full">
                                        {c.count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-grow flex items-center justify-center text-slate-400 font-medium text-center">
                            No cities data.
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Keywords Bar Chart & Table */}
                <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6">
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-6">
                        <BarChart3 className="w-5 h-5 text-red-600" />
                        Top Keywords
                    </h2>
                    <div className="h-[250px] w-full mb-6">
                        {loading ? (
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="w-8 h-8 border-4 border-slate-200 border-t-red-600 rounded-full animate-spin"></div>
                            </div>
                        ) : topKeywords.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topKeywords.slice(0, 5)} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <YAxis type="category" dataKey="keyword" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }} dx={-10} />
                                    <Tooltip 
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="count" name="Searches" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium">
                                No keywords data.
                            </div>
                        )}
                    </div>
                    
                    <div className="border border-slate-100 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-bold">
                                <tr>
                                    <th className="px-4 py-3 border-b border-slate-100">Keyword</th>
                                    <th className="px-4 py-3 border-b border-slate-100 text-right">Searches</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topKeywords.slice(0, 5).map((k, i) => (
                                    <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                                        <td className="px-4 py-3 font-semibold text-slate-700">{k.keyword}</td>
                                        <td className="px-4 py-3 text-right font-black text-slate-900">{k.count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* No Result Searches Table (Unmet Demand) */}
                <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-orange-500" />
                            Unmet Demand (Zero Results)
                        </h2>
                    </div>
                    
                    {loading ? (
                        <div className="h-[250px] flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-slate-200 border-t-red-600 rounded-full animate-spin"></div>
                        </div>
                    ) : noResults.length > 0 ? (
                        <div className="border border-slate-100 rounded-xl overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 font-bold">
                                    <tr>
                                        <th className="px-4 py-3 border-b border-slate-100">Keyword</th>
                                        <th className="px-4 py-3 border-b border-slate-100 text-right">Times Searched</th>
                                        <th className="px-4 py-3 border-b border-slate-100 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {noResults.map((k, i) => (
                                        <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                                            <td className="px-4 py-3 font-semibold text-slate-700">{k.keyword}</td>
                                            <td className="px-4 py-3 text-right font-black text-slate-900">{k.count}</td>
                                            <td className="px-4 py-3 text-center">
                                                {parseInt(k.count) > 5 ? (
                                                    <span className="px-2 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-md">High Priority Gap</span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-orange-50 text-orange-600 text-xs font-bold rounded-md">Monitor</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="h-[250px] flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                                <Search className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h3 className="font-bold text-slate-900 mb-1">All good!</h3>
                            <p className="text-slate-500 text-sm">No searches with zero results found for this period.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
