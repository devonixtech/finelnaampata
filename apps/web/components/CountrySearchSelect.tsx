"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    countries: string[];
    value: string;
    onChange: (country: string) => void;
    placeholder?: string;
}

export default function CountrySearchSelect({ countries, value, onChange, placeholder = "Select Country" }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const sortedCountries = useMemo(() => Array.from(new Set(countries)).sort((a, b) => a.localeCompare(b)), [countries]);

    const filteredCountries = useMemo(() => {
        if (!search.trim()) return sortedCountries;
        const q = search.toLowerCase();
        return sortedCountries.filter(c => c.toLowerCase().includes(q));
    }, [sortedCountries, search]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative w-full mb-4" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-6 py-5 bg-white transition-all duration-300 group ${isOpen ? 'rounded-t-[20px]' : 'rounded-[20px]'
                    }`}
            >
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl transition-colors ${value ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                        <Globe className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0">Your Country</span>
                        <span className={`text-lg font-bold truncate block leading-tight ${!value ? 'text-slate-300' : 'text-slate-900'}`}>
                            {value || placeholder}
                        </span>
                    </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-300 transition-transform duration-500 ${isOpen ? 'rotate-180 text-orange-500' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 4, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        className="absolute z-[100] top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[300px] rounded-[12px] min-w-[280px]"
                    >
                        {/* Search input */}
                        <div className="p-6 pb-4">
                            <div className="relative">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Search country..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-transparent focus:border-[#dadce0] rounded-md text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex-grow overflow-y-auto px-4 pb-6 custom-scrollbar">
                            {filteredCountries.length === 0 ? (
                                <div className="py-8 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                    No country found
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {filteredCountries.map(country => {
                                        const isSelected = country === value;
                                        return (
                                            <button
                                                key={country}
                                                type="button"
                                                onClick={() => {
                                                    onChange(country);
                                                    setIsOpen(false);
                                                    setSearch('');
                                                }}
                                                className={`w-full flex items-center justify-between px-6 py-3 rounded-md transition-all duration-300 ${isSelected
                                                    ? 'bg-[#1a73e8] text-white'
                                                    : 'hover:bg-slate-50 text-slate-600 font-medium'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <Globe className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-300'}`} />
                                                    <span className="text-base font-bold tracking-tight">{country}</span>
                                                </div>
                                                {isSelected && <Check className="w-5 h-5 animate-in zoom-in" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
