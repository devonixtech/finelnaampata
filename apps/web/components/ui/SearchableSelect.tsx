"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DynamicIcon from '../DynamicIcon';

export interface SelectOption {
    label: string;
    value: string;
    icon?: string | React.ReactNode;
    description?: string;
    keywords?: string;
}

interface Props {
    options: SelectOption[];
    value: string | undefined;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    loading?: boolean;
    disabled?: boolean;
    minimal?: boolean;
    searchable?: boolean;
    className?: string;
    icon?: React.ReactNode; // Optional default icon
    noOptionsMessage?: string;
}

export function SearchableSelect({ 
    options, 
    value, 
    onChange, 
    placeholder = "-- Select --", 
    searchPlaceholder = "Search...", 
    loading = false,
    disabled = false,
    minimal = false,
    searchable = true,
    className = "",
    icon,
    noOptionsMessage = "No matching options"
}: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = useMemo(() =>
        options.find(o => o.value === value),
        [options, value]);

    const filteredOptions = useMemo(() => {
        if (!search.trim()) return options;
        const q = search.toLowerCase();
        return options.filter(o =>
            o.label.toLowerCase().includes(q) ||
            o.description?.toLowerCase().includes(q) ||
            o.keywords?.toLowerCase().includes(q) ||
            o.value.toLowerCase().includes(q)
        );
    }, [options, search]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Render the icon for a specific option or the default icon
    const renderIcon = (iconProp: string | React.ReactNode | undefined, fallback?: React.ReactNode) => {
        if (!iconProp) return fallback || null;
        if (typeof iconProp === 'string') {
            return <DynamicIcon name={iconProp} className="w-5 h-5 text-slate-600" />;
        }
        return iconProp;
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                type="button"
                disabled={disabled || loading}
                onClick={() => setIsOpen(!isOpen)}
                className={minimal 
                    ? `w-full flex items-center justify-between bg-transparent border-none outline-none text-slate-900 text-sm font-bold cursor-pointer group ${disabled || loading ? 'opacity-60 cursor-not-allowed' : ''}`
                    : `w-full flex items-center justify-between px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold text-sm focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all ${disabled || loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-100'}`
                }
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400 shrink-0" />
                    ) : (
                        (selectedOption?.icon || icon) && (
                            <div className={`flex items-center justify-center shrink-0 ${minimal ? 'text-slate-300 group-hover:text-orange-500 transition-colors' : ''}`}>
                                {renderIcon(selectedOption?.icon, icon)}
                            </div>
                        )
                    )}
                    <span className={`truncate ${!selectedOption ? 'text-slate-400 font-medium' : ''}`}>
                        {loading ? 'Loading...' : selectedOption?.label || placeholder}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute z-[110] top-full mt-2 w-full min-w-[240px] bg-white rounded-3xl border border-slate-100 shadow-[0_15px_45px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col max-h-[360px]"
                    >
                        {searchable && (
                            <div className="p-3 border-b border-slate-50">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        autoFocus
                                        type="text"
                                        autoComplete="off"
                                        name="search_input_hidden"
                                        placeholder={searchPlaceholder}
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-slate-200 outline-none"
                                        onClick={e => e.stopPropagation()}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex-grow overflow-y-auto p-2 custom-scrollbar">
                            {filteredOptions.length === 0 ? (
                                <div className="p-8 text-center">
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{noOptionsMessage}</p>
                                </div>
                            ) : (
                                filteredOptions.map(option => {
                                    const isSelected = option.value === value;
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => {
                                                onChange(option.value);
                                                setIsOpen(false);
                                                setSearch('');
                                            }}
                                            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${isSelected ? 'bg-slate-900 text-white shadow-lg' : 'hover:bg-slate-50 text-slate-700'}`}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden text-left">
                                                {option.icon && (
                                                    <div className="shrink-0">
                                                        {renderIcon(option.icon)}
                                                    </div>
                                                )}
                                                <div className="truncate">
                                                    <p className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>{option.label}</p>
                                                    {option.description && (
                                                        <p className={`text-[10px] font-bold uppercase tracking-wider truncate mt-0.5 ${isSelected ? 'text-white/50' : 'text-slate-400'}`}>
                                                            {option.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            {isSelected && <Check className="w-4 h-4 shrink-0 ml-2" />}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
