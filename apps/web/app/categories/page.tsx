"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronRight, TrendingUp, Compass, Sliders, Star, ChefHat, Stethoscope, Sparkles, Wrench } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { api } from '../../lib/api';
import { Category } from '../../types/api';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const ITEMS_PER_PAGE = 12;

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const data = await api.categories.getAll();
                setCategories(data || []);
            } catch (err) {
                console.error('Failed to load categories:', err);
            } finally {
                setLoading(false);
            }
        };
        loadCategories();
    }, []);

    const iconMap: Record<string, React.ReactNode> = {
        'restaurants-food': <ChefHat className="w-6 h-6" />,
        'doctors': <Stethoscope className="w-6 h-6" />,
        'beauty-spa': <Sparkles className="w-6 h-6" />,
        'real-estate': <Compass className="w-6 h-6" />,
        'education': <Star className="w-6 h-6" />,
        'home-services-maintenance': <Wrench className="w-6 h-6" />,
        'automobile': <Compass className="w-6 h-6" />,
        'it-repair-maintenance': <Sliders className="w-6 h-6" />
    };

    const filteredCategories = useMemo(() => {
        if (!searchQuery.trim()) return categories;
        return categories.filter(c => 
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [categories, searchQuery]);

    const visibleCategories = filteredCategories.slice(0, visibleCount);
    const hasMore = visibleCount < filteredCategories.length;

    const handleLoadMore = () => {
        setVisibleCount(prev => prev + ITEMS_PER_PAGE);
    };

    // Reset visible count when search changes
    useEffect(() => {
        setVisibleCount(ITEMS_PER_PAGE);
    }, [searchQuery]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 py-32 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-t-2 border-orange-500 rounded-full animate-spin mb-6" />
                    <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Loading Categories...</p>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Navbar />

            {/* Premium Dark Header Section - Consistent with Search */}
            <div className="pt-24 pb-20 bg-[#112D4E] relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 right-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    {/* Breadcrumbs */}
                    <div className="flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-[0.15em] text-blue-200/70 mb-8">
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-white">Categories</span>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-3xl mx-auto mb-10"
                    >
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6">
                            Explore <span className="text-blue-400 font-medium italic">Categories</span>
                        </h1>
                        <p className="text-lg text-blue-100/70 max-w-xl mx-auto font-medium">
                            Discover the best local services, top-rated businesses, and extraordinary places near you.
                        </p>
                    </motion.div>

                    {/* Search Bar */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="max-w-2xl mx-auto relative"
                    >
                        <div className="bg-white rounded-2xl p-2 flex items-center shadow-2xl">
                            <div className="pl-4 pr-2">
                                <Search className="w-5 h-5 text-slate-400" />
                            </div>
                            <input 
                                type="text"
                                placeholder="Search for a category..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-transparent border-none outline-none text-base font-medium text-slate-900 py-3 px-2 placeholder:text-slate-400"
                            />
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors mr-1"
                                >
                                    <Search className="w-4 h-4 text-slate-400 hidden" />
                                    <span className="text-xs font-bold text-slate-500 uppercase">Clear</span>
                                </button>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-8 relative z-20">
                
                {/* Results Header */}
                <div className="flex items-center justify-between mb-8 px-2">
                    <h2 className="text-xl font-bold text-slate-900">
                        {searchQuery ? 'Search Results' : 'All Categories'}
                        <span className="ml-3 text-sm font-medium text-slate-500 bg-slate-200/50 px-3 py-1 rounded-full">
                            {filteredCategories.length}
                        </span>
                    </h2>
                </div>

                {filteredCategories.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-slate-100">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">No categories found</h3>
                        <p className="text-slate-500 font-medium">Try adjusting your search query.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <AnimatePresence>
                            {visibleCategories.map((cat, idx) => (
                                <motion.div
                                    key={cat.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Link href={`/categories/${cat.slug}`} className="group block h-full">
                                        <div className="bg-white border border-slate-100 rounded-[24px] p-6 h-full transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/5 hover:border-blue-100 flex flex-col items-start relative overflow-hidden">
                                            
                                            {/* Hover gradient background effect */}
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-bl-[100px] -z-0"></div>

                                            {/* Refined Icon Box */}
                                            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl mb-5 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm relative z-10">
                                                <div className="transform group-hover:scale-110 transition-transform duration-300">
                                                    {iconMap[cat.slug] || <TrendingUp className="w-6 h-6" />}
                                                </div>
                                            </div>

                                            {/* Content Area */}
                                            <div className="relative z-10 w-full">
                                                <div className="flex items-start justify-between gap-4 mb-2">
                                                    <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight line-clamp-2">
                                                        {cat.name}
                                                    </h3>
                                                </div>

                                                <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6 line-clamp-2">
                                                    {cat.description || `Explore top-rated listings specialized in ${cat.name.toLowerCase()}.`}
                                                </p>

                                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50 w-full">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-blue-500 transition-colors">
                                                        Explore Listings
                                                    </span>
                                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all duration-300 group-hover:translate-x-1">
                                                        <ChevronRight className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {/* Load More Button */}
                {hasMore && (
                    <div className="mt-16 flex justify-center">
                        <button 
                            onClick={handleLoadMore}
                            className="bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 px-8 py-4 rounded-2xl font-black text-sm tracking-wide transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                        >
                            Load More Categories
                            <ChevronRight className="w-4 h-4 rotate-90" />
                        </button>
                    </div>
                )}

            </main>

            <Footer />
        </div>
    );
}
