"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Sliders, LayoutGrid, List, ChevronRight } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import BusinessCard from '../../components/BusinessCard';
import { api } from '../../lib/api';
import { Business } from '../../types/api';
import Link from 'next/link';

export default function BusinessListingPage() {
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const fetchBusinesses = async () => {
            try {
                setLoading(true);
                const response = await api.listings.search({ page, limit: 12 });
                if (response && response.data) {
                    setBusinesses(response.data);
                    setTotalPages(response.meta.totalPages);
                    setTotalResults(response.meta.total);
                }
            } catch (error) {
                console.error('Error fetching businesses:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBusinesses();
    }, [page]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            <Navbar />

            {/* Header / Banner */}
            <div className="pt-32 pb-16 bg-[#112D4E] relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                </div>
                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <div className="flex items-center gap-2 text-blue-300 text-sm font-bold uppercase tracking-widest mb-4">
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-white">Businesses</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                        Explore Local Businesses
                    </h1>
                    <p className="text-blue-100/80 text-lg max-w-2xl font-medium">
                        Discover top-rated services and stores in your community. Trusted listings you can rely on.
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-12">
                {/* Stats & Controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <p className="text-slate-500 font-bold">
                            Showing <span className="text-slate-900">{businesses.length}</span> of <span className="text-slate-900">{totalResults}</span> businesses
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex p-1 bg-white rounded-xl border border-slate-200 shadow-sm">
                            <button className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <LayoutGrid className="w-5 h-5" />
                            </button>
                            <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg opacity-50 cursor-not-allowed">
                                <List className="w-5 h-5" />
                            </button>
                        </div>
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
                            <Sliders className="w-4 h-4" />
                            Filter
                        </button>
                    </div>
                </div>

                {loading && page === 1 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {Array(8).fill(0).map((_, i) => (
                            <div key={i} className="bg-white h-[400px] rounded-3xl shadow-sm animate-pulse border border-slate-100" />
                        ))}
                    </div>
                ) : businesses.length > 0 ? (
                    <>
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                        >
                            {businesses.map((biz, idx) => (
                                <motion.div key={biz.id} variants={itemVariants}>
                                    <BusinessCard
                                        business={biz}
                                    />
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-16 flex justify-center items-center gap-3">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-6 py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <div className="flex items-center gap-1">
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setPage(i + 1)}
                                            className={`w-12 h-12 rounded-xl font-black transition-all ${page === i + 1
                                                ? 'bg-blue-600 text-white shadow-lg'
                                                : 'hover:bg-white hover:shadow-md text-slate-600'
                                                }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-6 py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">No businesses found</h3>
                        <p className="text-slate-500 font-medium">We couldn't find any businesses at the moment.</p>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
