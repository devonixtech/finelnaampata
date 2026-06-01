"use client";

import React, { useState, useEffect } from 'react';
import { Heart, Search, Lock } from 'lucide-react';
import { api } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { FeatureGate } from '../../../components/vendor/FeatureGate';
import BusinessCard from '../../../components/BusinessCard';
import { Business } from '../../../types/api';
import Link from 'next/link';

export default function SavedPage() {
    const { user } = useAuth();
    const [savedBusinesses, setSavedBusinesses] = useState<Business[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSaved = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            try {
                const response = await api.users.getFavorites();
                setSavedBusinesses(response.data || []);
            } catch (error) {
                console.error('Error fetching saved businesses:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSaved();
    }, [user]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest">Loading your saved businesses...</p>
            </div>
        );
    }
    
    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                    <Heart className="w-10 h-10 text-slate-300" />
                </div>
                <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Please Log In</h1>
                <p className="text-slate-400 font-bold max-w-md text-lg mb-8">You need to be logged in to view your saved businesses.</p>
                <Link href="/login" className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700  shadow-blue-500/20 transition-all active:scale-95">
                    Login Now
                </Link>
            </div>
        );
    }

    return (
        <FeatureGate feature="showSaved" title="Unlock Saved Businesses" description="Create your personal collection of favorite businesses and partners for quick access. Save time with a curated dashboard.">
            <div className="space-y-12 pb-20">
                <div>
                    <h1 className="text-4xl lg:text-5xl font-black text-slate-900 mb-3 tracking-tight flex items-center gap-4">
                        Saved Businesses <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
                    </h1>
                    <p className="text-slate-400 font-bold tracking-tight text-lg">Your curated collection of businesses and partners.</p>
                </div>

                {savedBusinesses.length > 0 ? (
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {savedBusinesses.map((biz) => (
                            <BusinessCard
                                key={biz.id}
                                business={biz}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-center px-4">
                        <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mb-6">
                            <Heart className="w-10 h-10 text-rose-200" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Your collection is empty</h3>
                        <p className="text-slate-400 font-bold max-w-sm mb-10">Start browsing the directory and click the heart icon to save businesses for later.</p>
                        <Link href="/search" className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all  active:scale-95">
                            Discover Businesses
                        </Link>
                    </div>
                )}
            </div>
        </FeatureGate>
    );
}
