"use client";

import React from 'react';
import { Construction } from 'lucide-react';
import Link from 'next/link';

export default function SearchHeatmapPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Construction className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Feature Unavailable</h2>
            <p className="text-slate-500 font-bold text-sm mb-6">Search Heatmap has been disabled.</p>
            <Link href="/admin" className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-sm hover:bg-slate-800 transition-all">
                Back to Dashboard
            </Link>
        </div>
    );
}
