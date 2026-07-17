"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MapPin, ChevronDown, Check, Search, Navigation, Loader2, Signal } from 'lucide-react';
import { City } from '../types/api';
import { motion, AnimatePresence } from 'framer-motion';
import { detectNearestCityName, sortAndDedupeCities } from '../lib/location-detect';

interface Props {
    cities: City[];
    value: string;
    onChange: (cityName: string) => void;
    placeholder?: string;
    minimal?: boolean;
}

export default function CitySearchSelect({ cities, value, onChange, placeholder = "Select City", minimal = false }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [isLocating, setIsLocating] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const sortedCities = useMemo(() => sortAndDedupeCities(cities), [cities]);

    const filteredCities = useMemo(() => {
        if (!search.trim()) return sortedCities;
        const q = search.toLowerCase();
        return sortedCities.filter(c => c.name.toLowerCase().includes(q));
    }, [sortedCities, search]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAutoDetect = async () => {
        setIsLocating(true);
        try {
            const cityName = await detectNearestCityName(sortedCities);
            if (cityName) {
                onChange(cityName);
                setIsOpen(false);
            } else {
                alert('Could not match your location to a city. Please select manually.');
            }
        } catch (error) {
            console.error('Error getting location:', error);
            alert('Could not get your location. Please select manually.');
        } finally {
            setIsLocating(false);
        }
    };

    return (
        <div className={`relative ${minimal ? '' : 'w-full'}`} ref={containerRef}>
            {minimal ? (
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 text-[#70757a] hover:text-[#202124] transition-colors py-1 px-2 rounded-md hover:bg-gray-50"
                >
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm font-medium">{value || placeholder}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            ) : (
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full flex items-center justify-between px-6 py-5 bg-white transition-all duration-300 group ${isOpen ? 'rounded-t-[20px]' : 'rounded-[20px]'
                        }`}
                >
                    <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-xl transition-colors ${value ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                            <MapPin className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0">Your Area</span>
                            <span className={`text-lg font-bold truncate block leading-tight ${!value ? 'text-slate-300' : 'text-slate-900'}`}>
                                {value || placeholder}
                            </span>
                        </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-slate-300 transition-transform duration-500 ${isOpen ? 'rotate-180 text-orange-500' : ''}`} />
                </button>
            )}

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 4, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        className={`absolute z-[100] ${minimal ? 'right-0 top-full' : 'top-full left-0 right-0'} mt-2 bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[400px] rounded-[12px] min-w-[280px]`}
                    >
                        {/* Auto-detect button */}
                        <div className="p-6 pb-2">
                            <button
                                onClick={handleAutoDetect}
                                disabled={isLocating}
                                className="w-full relative group overflow-hidden py-3 px-6 bg-[#f8f9fa] hover:bg-[#f1f3f4] border border-[#f8f9fa] hover:border-[#dadce0] text-[#3c4043] rounded-md font-medium text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {isLocating ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <div className="relative">
                                        <Navigation className="w-4 h-4" />
                                        <motion.div
                                            animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            className="absolute inset-0 bg-white rounded-full -z-10"
                                        />
                                    </div>
                                )}
                                {isLocating ? 'Scanning Area...' : 'Auto-Detect Location'}
                            </button>
                        </div>

                        {/* Search input */}
                        <div className="p-6 pb-4">
                            <div className="relative">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Which city are you in?"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-transparent focus:border-[#dadce0] rounded-md text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex-grow overflow-y-auto px-4 pb-6 custom-scrollbar">
                            {filteredCities.length === 0 ? (
                                <div className="py-12 text-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Signal className="w-8 h-8 text-slate-200" />
                                    </div>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">No city found</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {filteredCities.slice(0, 50).map(city => {
                                        const isSelected = city.name === value;
                                        const rowKey = `${city.id || city.name}-${city.country || 'global'}`;
                                        return (
                                            <button
                                                key={rowKey}
                                                type="button"
                                                onClick={() => {
                                                    onChange(city.name);
                                                    setIsOpen(false);
                                                    setSearch('');
                                                }}
                                                className={`w-full flex items-center justify-between px-6 py-3 rounded-md transition-all duration-300 ${isSelected
                                                    ? 'bg-[#1a73e8] text-white'
                                                    : 'hover:bg-slate-50 text-slate-600 font-medium'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <MapPin className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-300'}`} />
                                                    <span className="text-base font-bold tracking-tight">{city.name}</span>
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
