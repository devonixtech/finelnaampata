"use client";

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ArrowLeft, Loader2, Map as MapIcon, RefreshCcw } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('./MapComponent'), { 
    ssr: false,
    loading: () => (
        <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p className="text-sm font-medium">Loading map...</p>
        </div>
    )
});

export default function SearchHeatmapPage() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            // Try fetching from admin endpoint
            const res = await api.admin.getHeatmapData();
            if (res) {
                setData(res);
            }
        } catch (err) {
            console.error("Failed to load heatmap data:", err);
            setError("Failed to load heatmap data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] min-h-[600px] max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <Link href="/admin" className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </Link>
                        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                            <MapIcon className="w-6 h-6 text-indigo-600" />
                            Search Demand Heatmap
                        </h1>
                    </div>
                    <p className="text-slate-500 font-medium ml-12">
                        Visualizing geographical search volume and demand density.
                    </p>
                </div>
                <button 
                    onClick={loadData}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                    <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden relative">
                {error ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6">
                        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                            <MapIcon className="w-8 h-8 text-red-400" />
                        </div>
                        <p className="text-red-600 font-bold mb-2">{error}</p>
                        <button onClick={loadData} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                            Try Again
                        </button>
                    </div>
                ) : (
                    <div className="absolute inset-0 z-0">
                        <MapComponent data={data} />
                    </div>
                )}
                
                {/* Overlay stats if data is loaded */}
                {!loading && !error && data.length > 0 && (
                    <div className="absolute top-4 right-4 z-[400] bg-white/90 backdrop-blur border border-slate-200 rounded-xl p-4 shadow-lg pointer-events-none">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Data Points</div>
                        <div className="text-2xl font-black text-slate-900">{data.length}</div>
                    </div>
                )}
            </div>
        </div>
    );
}
