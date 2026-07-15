'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    TrendingUp,
    MapPin,
    Search,
    RefreshCcw,
    Sparkles,
    Flame,
    Loader2,
} from 'lucide-react';
import { api } from '../../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';

export default function AdminDemandDashboard() {
    const [selectedCity, setSelectedCity] = useState('');
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const result = await api.demand.getOverview(selectedCity);
            setData(result);
        } catch (error) {
            console.error("Failed to fetch demand insights:", error);
        } finally {
            setLoading(false);
        }
    }, [selectedCity]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const insights = (data as any)?.insights || [];
    const topCities = (data as any)?.topCities || [];
    const aiSummary = (data as any)?.aiSummary || '';
    const totalBusinesses = (data as any)?.stats?.totalVendors || 0;

    // Derived metrics
    const hotKeywords = useMemo(() =>
        [...insights].sort((a: any, b: any) => b.growth - a.growth).slice(0, 5),
        [insights]
    );

    return (
        <div className="min-h-screen bg-[#FDFDFD] p-8 lg:p-12">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-slate-900 rounded-[20px] flex items-center justify-center text-white shadow-xl rotate-3">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tight">AI Demand <span className="text-blue-600">Insights</span></h1>
                    </div>
                    <p className="text-slate-400 font-bold max-w-2xl leading-relaxed uppercase tracking-widest text-xs">
                        {selectedCity || 'Global'} / Real-time User Intent Analysis & Market Velocity
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group min-w-[280px] bg-white border border-black rounded-[24px] overflow-hidden focus-within:ring-4 focus-within:ring-blue-100 transition-all">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 z-10">
                            <MapPin className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                        </div>
                        <SearchableSelect
                            value={selectedCity}
                            onChange={val => setSelectedCity(val)}
                            options={[
                                { label: "System Wide (All Cities)", value: "" },
                                ...topCities.map((city: any) => ({
                                    label: `${city.city} (${city.count} hits)`,
                                    value: city.city
                                }))
                            ]}
                        />
                    </div>

                    <button
                        onClick={() => refresh()}
                        disabled={loading}
                        className="h-14 w-14 bg-white border border-black text-slate-900 rounded-[24px] hover:bg-slate-900 hover:text-white disabled:opacity-50 transition-all active:scale-95 shadow-sm flex items-center justify-center group"
                    >
                        <RefreshCcw className={`w-5 h-5 transition-transform duration-700 group-hover:rotate-180 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Top Level Intelligence Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                <div className="bg-white p-8 rounded-[32px] border border-black shadow-slate-200/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 relative z-10">Total Search Activity (7d)</p>
                    <div className="flex items-end gap-3 relative z-10">
                        <h4 className="text-4xl font-black text-slate-900">
                            {((data as any)?.totalSearches7d || 0).toLocaleString()}
                        </h4>
                        <span className="text-emerald-500 text-xs font-black mb-1 flex items-center">
                            <ArrowUpRight className="w-3 h-3" /> Live
                        </span>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[32px] border border-black shadow-slate-200/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 relative z-10">Total System Listings</p>
                    <h4 className="text-4xl font-black text-blue-600 relative z-10">
                        {(data as any)?.stats?.totalListings || 0}
                    </h4>
                </div>

                <div className="bg-white p-8 rounded-[32px] border border-black shadow-slate-200/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full -z-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 relative z-10">Platform Businesses</p>
                    <h4 className="text-4xl font-black text-red-600 relative z-10">{totalBusinesses}</h4>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-10">
                {/* Main Rankings Table */}
                <div className="lg:col-span-8 bg-white rounded-[32px] border border-black shadow-slate-200/20 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white border border-black rounded-2xl flex items-center justify-center shadow-sm">
                                <Activity className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Service Demand Rankings</h3>
                                <p className="text-xs text-slate-400 font-bold mt-0.5 uppercase tracking-widest">Keyword Velocity Analysis</p>
                            </div>
                        </div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-full">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" /> Updated Live
                        </div>
                    </div>

                    <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
                        <table className="w-full text-left relative">
                            <thead className="sticky top-0 bg-white z-10 shadow-sm border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white">Service Cluster</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white">Primary Hub</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white">Trend Index</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right bg-white">24h Growth</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-24 text-center">
                                            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                                            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Simulating Intelligent Demand Graph...</p>
                                        </td>
                                    </tr>
                                ) : insights.length > 0 ? (
                                    insights.map((item: any, idx: number) => (
                                        <tr key={item.normalizedKeyword} className="hover:bg-slate-50/50 transition-all duration-300 group cursor-default">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center font-black text-white text-xs group-hover:scale-110 transition-transform">
                                                        {idx + 1}
                                                    </div>
                                                    <div>
                                                        <span className="font-black text-slate-900 text-base capitalize group-hover:text-blue-600 transition-colors">
                                                            {item.keyword}
                                                        </span>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Total Hits: {item.count7d}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${item.topCity === 'Global' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-600'
                                                    }`}>
                                                    {item.topCity}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-1 min-w-[120px] h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${Math.min(100, item.score)}%` }}
                                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                                            className={`h-full ${item.score > 80 ? 'bg-red-500' : 'bg-blue-600'} rounded-full`}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-black text-slate-900 font-mono">{Math.round(item.score)}%</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className={`inline-flex items-center gap-1 font-black px-3 py-1 rounded-full text-xs ${item.growth > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                                                    }`}>
                                                    {item.growth > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                                    {Math.abs(Math.round(item.growth))}%
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic font-black uppercase tracking-widest text-xs py-32">
                                            No Intent Signals Detected for this selection
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Sidebar intelligence */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Hot Demand List */}
                    <section className="bg-slate-900 rounded-[32px] p-8 text-white border border-black shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                            <Flame className="w-24 h-24 text-orange-400" />
                        </div>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-orange-400 shadow-xl border border-white/10">
                                <Flame className="w-6 h-6 fill-orange-400" />
                            </div>
                            <h3 className="text-2xl font-black tracking-tight text-white">Hot Demand</h3>
                        </div>

                        <div className="space-y-6">
                            {hotKeywords.map((item: any, idx: number) => (
                                <div key={item.normalizedKeyword} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs font-black text-white/20 italic">0{idx + 1}</span>
                                        <span className="font-black text-sm capitalize">{item.keyword}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="text-orange-400 font-black text-xs">+{Math.round(item.growth)}% Spike</div>
                                        <span className="text-[9px] text-white/30 font-black uppercase tracking-widest mt-0.5">Momentum High</span>
                                    </div>
                                </div>
                            ))}
                            {hotKeywords.length === 0 && (
                                <p className="text-white/40 italic text-sm text-center py-6 border border-dashed border-white/10 rounded-2xl bg-white/5">
                                    No significant spikes detected globally.
                                </p>
                            )}
                        </div>
                    </section>

                    {/* AI Strategic Summary */}
                    {/* <section className="bg-indigo-900 rounded-[32px] p-8 text-white border border-black shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                            <Sparkles className="w-24 h-24 text-indigo-400" />
                        </div>

                        <div className="flex items-center gap-4 mb-6 relative z-10">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-200 border border-white/10">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black tracking-tight">AI Strategy</h3>
                                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Tactical Guidance</p>
                            </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 relative z-10 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {typeof aiSummary === 'string' || !aiSummary ? (
                                <p className="text-slate-100 text-sm leading-relaxed italic font-medium">
                                    {typeof aiSummary === 'string' ? aiSummary : 'Analysis in progress. AI is currently correlating search patterns with market availability to generate regional strategy recommendations...'}
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {aiSummary.insights?.map((insight: string, i: number) => (
                                        <div key={`insight-${i}`} className="flex gap-3 text-sm text-slate-100 leading-relaxed font-medium">
                                            <span className="text-indigo-400 mt-1 flex-shrink-0">•</span>
                                            <p>{insight}</p>
                                        </div>
                                    ))}
                                    {aiSummary.recommendations?.length > 0 && <div className="h-px bg-white/10 my-4" />}
                                    {aiSummary.recommendations?.map((rec: string, i: number) => (
                                        <div key={`rec-${i}`} className="flex gap-3 text-sm text-indigo-200 leading-relaxed font-bold">
                                            <span className="text-amber-400 mt-0.5 flex-shrink-0">★</span>
                                            <p>{rec}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <div className="mt-6 flex items-center justify-between relative z-10">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Confidence Index: 94%</span>
                            <button className="text-[10px] font-black uppercase tracking-widest underline decoration-indigo-400 decoration-2 underline-offset-4 hover:text-indigo-200 transition-colors">
                                View Full Report
                            </button>
                        </div>
                    </section> */}
                </div>
            </div>
        </div>
    );
}
