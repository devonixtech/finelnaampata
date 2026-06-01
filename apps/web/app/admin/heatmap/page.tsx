"use client";

import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { Map as MapIcon, RefreshCcw, Navigation, Search, Layers, Sliders, Info, Zap } from 'lucide-react';

export default function SearchHeatmapPage() {
    const [heatmapData, setHeatmapData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Heatmap options
    const [radius, setRadius] = useState(30);
    const [opacity, setOpacity] = useState(0.8);
    const [dissipating, setDissipating] = useState(true);

    const hotspotRows = heatmapData
        .map((point) => ({
            latitude: Number(point.latitude),
            longitude: Number(point.longitude),
            weight: Number(point.weight) || 0,
        }))
        .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude))
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 200);

    const fetchHeatmapData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.admin.getHeatmapData(startDate || undefined, endDate || undefined);
            const data = (response as any)?.data || response; // Unwrap TransformInterceptor { data } wrapper
            setHeatmapData(Array.isArray(data) ? data : []);
        } catch (err: any) {
            console.error('Failed to fetch heatmap data:', err);
            setError(err?.message || 'Failed to load heatmap data. Check your permissions.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHeatmapData();
    }, []);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        fetchHeatmapData();
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Error Banner */}
            {error && (
                <div className="flex items-start gap-4 bg-red-50 border border-red-200 text-red-700 px-6 py-5 rounded-2xl">
                    <div className="w-5 h-5 mt-0.5 flex-shrink-0 rounded-full bg-red-200 flex items-center justify-center text-red-700 font-black text-xs">!</div>
                    <div>
                        <p className="font-black text-sm">Heatmap API Error</p>
                        <p className="text-sm font-medium mt-0.5 text-red-600">{error}</p>
                    </div>
                    <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-700 font-black text-lg leading-none">&times;</button>
                </div>
            )}
            {/* Header Section */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-3">
                        Search <span className="text-red-600">Intensity</span>
                    </h1>
                    <div className="flex flex-wrap items-center gap-4">
                        <p className="text-slate-500 font-bold flex items-center gap-2 bg-slate-100/50 px-4 py-2 rounded-2xl border border-slate-200/50">
                            <MapIcon className="w-4 h-4 text-red-600" />
                            Live Search Origins & Regional Keyword Densities
                        </p>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Live Heatmapping</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <form onSubmit={handleFilter} className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-[24px] p-1 shadow-sm">
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
                        <button
                            type="submit"
                            disabled={loading}
                            className="h-14 w-14 bg-red-600 text-white rounded-[24px] hover:bg-red-700 disabled:opacity-50 transition-all active:scale-95 shadow-xl shadow-red-200 flex items-center justify-center group"
                        >
                            <RefreshCcw className={`w-6 h-6 transition-transform duration-500 group-hover:rotate-180 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </form>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Control Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3">
                                <Sliders className="w-5 h-5 text-red-600" />
                                Visual Controls
                            </h3>

                            <div className="space-y-8">
                                {/* Radius Control */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Search Radius</label>
                                        <span className="text-sm font-black text-slate-900 bg-slate-50 px-3 py-1 rounded-xl border border-slate-100">{radius}px</span>
                                    </div>
                                    <input
                                        type="range" min="10" max="80" value={radius}
                                        onChange={(e) => setRadius(parseInt(e.target.value))}
                                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-red-600"
                                    />
                                    <p className="text-[10px] text-slate-400 font-medium">Bigger radius spreads the heat across larger areas.</p>
                                </div>

                                {/* Opacity Control */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Intensity Opacity</label>
                                        <span className="text-sm font-black text-slate-900 bg-slate-50 px-3 py-1 rounded-xl border border-slate-100">{Math.round(opacity * 100)}%</span>
                                    </div>
                                    <input
                                        type="range" min="0.1" max="1" step="0.1" value={opacity}
                                        onChange={(e) => setOpacity(parseFloat(e.target.value))}
                                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-red-600"
                                    />
                                </div>

                                {/* Toggle Dissipating */}
                                <div className="pt-4">
                                    <button
                                        onClick={() => setDissipating(!dissipating)}
                                        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${dissipating ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-400'
                                            }`}
                                    >
                                        <span className="text-xs font-black uppercase tracking-widest">Zoom Dissipation</span>
                                        <div className={`w-10 h-5 rounded-full relative transition-colors ${dissipating ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${dissipating ? 'left-6' : 'left-1'}`} />
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-50">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Legend</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-3 rounded-full bg-gradient-to-r from-blue-500 via-yellow-400 to-red-600" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase">Demand Gradient</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-red-600 ring-4 ring-red-100" />
                                    <span className="text-[10px] font-bold text-slate-600 italic">High Search Density</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                            <Zap className="w-24 h-24" />
                        </div>
                        <h4 className="text-lg font-black mb-2 relative">Pro Tip</h4>
                        <p className="text-sm font-medium text-slate-300 leading-relaxed relative">
                            Increase the **Radius** to identify broad regional trends, or decrease it to pinpoint specific neighborhood hotspots.
                        </p>
                    </div>
                </div>

                {/* Intensity Table */}
                <div className="lg:col-span-3">
                    <div className="bg-white p-4 rounded-[1rem] border border-slate-100 shadow-xl relative min-h-[600px]">
                        <div className="w-full h-[650px] rounded-[2.5rem] overflow-hidden bg-slate-50 relative shadow-inner border border-slate-100">
                            <div className="h-full flex flex-col">
                                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">Top Search Hotspots</p>
                                    <p className="text-xs font-bold text-slate-400">Rows: {hotspotRows.length}</p>
                                </div>
                                <div className="flex-1 overflow-auto">
                                    <table className="w-full text-sm">
                                        <thead className="sticky top-0 bg-slate-100">
                                            <tr>
                                                <th className="text-left px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-500">Latitude</th>
                                                <th className="text-left px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-500">Longitude</th>
                                                <th className="text-left px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-500">Weight</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {hotspotRows.map((row, idx) => (
                                                <tr key={`${row.latitude}-${row.longitude}-${idx}`} className="border-b border-slate-100">
                                                    <td className="px-6 py-3 font-mono text-slate-700">{row.latitude.toFixed(6)}</td>
                                                    <td className="px-6 py-3 font-mono text-slate-700">{row.longitude.toFixed(6)}</td>
                                                    <td className="px-6 py-3 font-black text-slate-900">{row.weight.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {loading && (
                            <div className="absolute inset-4 bg-white/60 backdrop-blur-xl flex items-center justify-center rounded-[2.5rem] z-10 animate-in fade-in duration-300">
                                <div className="flex flex-col items-center gap-6">
                                    <div className="relative">
                                        <div className="w-20 h-20 border-4 border-slate-100 rounded-full" />
                                        <div className="absolute inset-0 w-20 h-20 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-black text-2xl text-slate-900 tracking-tight">Processing High-Density Geodata</p>
                                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Please wait a moment</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!loading && heatmapData.length === 0 && (
                            <div className="absolute inset-4 flex items-center justify-center pointer-events-none z-10">
                                <div className="bg-white/95 backdrop-blur-3xl px-12 py-16 rounded-[3.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] border border-slate-100 text-center max-w-md pointer-events-auto scale-in duration-500">
                                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-8 ring-8 ring-slate-50/50">
                                        <Info className="w-10 h-10 text-slate-300" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 mb-3">No Intensity Data Captured</h3>
                                    <p className="text-slate-500 font-bold text-sm leading-relaxed mb-8">
                                        There are no recorded search logs for the selected date range. Try widening your search filter.
                                    </p>
                                    <button
                                        onClick={() => { setStartDate(''); setEndDate(''); fetchHeatmapData(); }}
                                        className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:translate-y-[-2px] transition-all"
                                    >
                                        Reset All Dates
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Status Overlay */}
                        {/* {heatmapData.length > 0 && !loading && (
                            <div className="absolute bottom-10 right-10 flex gap-4 animate-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-white/90 backdrop-blur-md px-6 py-4 rounded-3xl shadow-xl border border-white/20 flex flex-col items-end">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Data Points</p>
                                    <p className="text-2xl font-black text-slate-900 leading-none">{heatmapData.reduce((acc, c) => acc + c.weight, 0)}</p>
                                </div>
                            </div>
                        )} */}
                    </div>
                </div>
            </div>
        </div>
    );
}
