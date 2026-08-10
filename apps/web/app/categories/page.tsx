"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronRight, ArrowRight, Store, TrendingUp, X } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { api } from '../../lib/api';
import { Category } from '../../types/api';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const ITEMS_PER_PAGE = 12;

const GRADIENT_PALETTE = [
  'from-orange-400 to-red-500',
  'from-blue-400 to-indigo-600',
  'from-emerald-400 to-teal-600',
  'from-purple-400 to-violet-600',
  'from-pink-400 to-rose-600',
  'from-cyan-400 to-blue-600',
  'from-amber-400 to-orange-600',
  'from-lime-400 to-green-600',
  'from-fuchsia-400 to-purple-600',
  'from-sky-400 to-cyan-600',
  'from-rose-400 to-pink-600',
  'from-teal-400 to-emerald-600',
];

const ICON_BG_PALETTE = [
  'from-orange-100 to-red-100',
  'from-blue-100 to-indigo-100',
  'from-emerald-100 to-teal-100',
  'from-purple-100 to-violet-100',
  'from-pink-100 to-rose-100',
  'from-cyan-100 to-blue-100',
  'from-amber-100 to-orange-100',
  'from-lime-100 to-green-100',
  'from-fuchsia-100 to-purple-100',
  'from-sky-100 to-cyan-100',
  'from-rose-100 to-pink-100',
  'from-teal-100 to-emerald-100',
];

const ICON_TEXT_PALETTE = [
  'text-orange-600',
  'text-blue-600',
  'text-emerald-600',
  'text-purple-600',
  'text-pink-600',
  'text-cyan-600',
  'text-amber-600',
  'text-lime-600',
  'text-fuchsia-600',
  'text-sky-600',
  'text-rose-600',
  'text-teal-600',
];

const ICON_HOVER_BG_PALETTE = [
  'group-hover:from-orange-500 group-hover:to-red-600',
  'group-hover:from-blue-500 group-hover:to-indigo-700',
  'group-hover:from-emerald-500 group-hover:to-teal-700',
  'group-hover:from-purple-500 group-hover:to-violet-700',
  'group-hover:from-pink-500 group-hover:to-rose-700',
  'group-hover:from-cyan-500 group-hover:to-blue-700',
  'group-hover:from-amber-500 group-hover:to-orange-700',
  'group-hover:from-lime-500 group-hover:to-green-700',
  'group-hover:from-fuchsia-500 group-hover:to-purple-700',
  'group-hover:from-sky-500 group-hover:to-cyan-700',
  'group-hover:from-rose-500 group-hover:to-pink-700',
  'group-hover:from-teal-500 group-hover:to-emerald-700',
];

function formatBusinessCount(count?: number): string {
  if (!count || count === 0) return '0 businesses';
  if (count >= 1000) {
    const formatted = (count / 1000).toFixed(count >= 10000 ? 0 : 1);
    return `${formatted}k+ businesses`;
  }
  return `${count.toLocaleString()} businesses`;
}

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

  const filteredCategories = useMemo(() => {
    const sorted = [...categories].sort((a, b) => (b.businessCount || 0) - (a.businessCount || 0));
    if (!searchQuery.trim()) return sorted;
    return sorted.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [categories, searchQuery]);

  const visibleCategories = filteredCategories.slice(0, visibleCount);
  const hasMore = visibleCount < filteredCategories.length;

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + ITEMS_PER_PAGE);
  };

  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-40 flex flex-col items-center justify-center">
          <div className="relative">
            <div className="w-14 h-14 border-4 border-blue-100 rounded-full animate-spin" />
            <div className="absolute inset-0 w-14 h-14 border-4 border-transparent border-t-blue-500 rounded-full animate-spin" />
          </div>
          <p className="mt-6 text-slate-400 font-bold text-sm uppercase tracking-widest">Loading Categories</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-28 pb-14 bg-gradient-to-br from-[#0F172A] via-[#1E3A5F] to-[#1E40AF] relative overflow-hidden">
        {/* Ambient glow effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Breadcrumbs */}
          <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-200/50 mb-6">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-blue-100">Categories</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08] mb-4">
              Explore Categories
            </h1>
            <p className="text-lg text-blue-100/60 max-w-xl mx-auto font-medium mb-10">
              Find top-rated businesses organized by what you need
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-cyan-500/30 rounded-2xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-white rounded-2xl p-1.5 flex items-center shadow-2xl shadow-black/10">
                <div className="pl-4">
                  <Search className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-base font-medium text-slate-900 py-3.5 px-3 placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mr-1 p-2 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-500 uppercase hidden sm:block">Clear</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center justify-center gap-6 mt-8 text-sm font-medium text-blue-200/50"
          >
            <span className="flex items-center gap-1.5">
              <Store className="w-4 h-4" />
              {filteredCategories.length} Categories
            </span>
            <span className="w-1 h-1 bg-blue-300/30 rounded-full" />
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              Sorted by popularity
            </span>
          </motion.div>
        </div>
      </section>

      {/* Categories Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 -mt-6 relative z-20">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {searchQuery ? (
                <>Results for &ldquo;{searchQuery}&rdquo;</>
              ) : (
                'All Categories'
              )}
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {filteredCategories.length} {filteredCategories.length === 1 ? 'category' : 'categories'} available
            </p>
          </div>
        </div>

        {/* Empty State */}
        {filteredCategories.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-12 sm:p-16 text-center shadow-sm border border-slate-100"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Search className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">No categories found</h3>
            <p className="text-slate-500 font-medium max-w-sm mx-auto">
              Try adjusting your search or browse all available categories below.
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-6 px-6 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-sm rounded-xl transition-colors"
              >
                Clear Search
              </button>
            )}
          </motion.div>
        )}

        {/* Category Cards Grid */}
        {filteredCategories.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            <AnimatePresence mode="popLayout">
              {visibleCategories.map((cat, idx) => {
                const colorIndex = idx % GRADIENT_PALETTE.length;
                const gradientBg = GRADIENT_PALETTE[colorIndex];
                const iconBg = ICON_BG_PALETTE[colorIndex];
                const iconText = ICON_TEXT_PALETTE[colorIndex];
                const iconHoverBg = ICON_HOVER_BG_PALETTE[colorIndex];

                return (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.35, delay: Math.min(idx * 0.04, 0.3) }}
                    layout
                  >
                    <Link
                      href={`/search?category=${cat.slug}`}
                      className="group block"
                    >
                      <div className="relative bg-white rounded-2xl border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/80 hover:border-slate-200 hover:-translate-y-1 flex flex-col h-full">
                        {/* Top gradient accent */}
                        <div className={`h-1.5 w-full bg-gradient-to-r ${gradientBg} opacity-60 group-hover:opacity-100 transition-opacity`} />

                        <div className="p-5 sm:p-6 flex flex-col flex-1">
                          <div className="flex items-start gap-4 mb-4">
                            {/* Icon */}
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${iconBg} ${iconHoverBg} ${iconText} group-hover:text-white flex items-center justify-center flex-shrink-0 transition-all duration-300 shadow-sm group-hover:shadow-md`}>
                              <Store className="w-6 h-6" />
                            </div>

                            {/* Text */}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2">
                                {cat.name}
                              </h3>
                              {cat.description && (
                                <p className="text-sm text-slate-500 font-medium mt-1 line-clamp-2 leading-relaxed">
                                  {cat.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Bottom Row */}
                          <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                            <span className="text-sm font-semibold text-slate-500">
                              {formatBusinessCount(cat.businessCount)}
                            </span>
                            <div className="flex items-center gap-1 text-sm font-bold text-slate-400 group-hover:text-blue-500 transition-colors">
                              <span className="hidden sm:block">Browse</span>
                              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="mt-12 flex justify-center">
            <motion.button
              onClick={handleLoadMore}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative group/btn px-8 py-4 rounded-2xl font-bold text-sm tracking-wide overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 group-hover/btn:from-blue-700 group-hover/btn:to-indigo-700 transition-all duration-300 rounded-2xl" />
              <span className="relative flex items-center gap-2 text-white">
                Load More Categories
                <ArrowRight className="w-4 h-4 rotate-90" />
              </span>
            </motion.button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
