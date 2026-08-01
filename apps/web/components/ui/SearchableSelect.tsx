"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';
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
    icon?: React.ReactNode;
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
    const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);

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

    const handleToggle = () => {
        if (!disabled && !loading) {
            if (!isOpen && containerRef.current) {
                setButtonRect(containerRef.current.getBoundingClientRect());
            }
            setIsOpen(!isOpen);
        }
    };

    const renderIcon = (iconProp: string | React.ReactNode | undefined, fallback?: React.ReactNode) => {
        if (!iconProp) return fallback || null;
        if (typeof iconProp === 'string') {
            return <DynamicIcon name={iconProp} className="w-5 h-5 text-slate-600" />;
        }
        return iconProp;
    };

    const dropdownContent = isOpen && buttonRect ? (() => {
        const spaceBelow = window.innerHeight - buttonRect.bottom;
        const openAbove = spaceBelow < 340;
        const top = openAbove ? buttonRect.top - 8 : buttonRect.bottom + 8;
        return (
        <div className="fixed z-[9999]" style={{ top, left: buttonRect.left, width: buttonRect.width, minWidth: 240 }} onMouseDown={e => e.stopPropagation()}>
            <div className={`bg-white rounded-2xl border border-slate-200 shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col max-h-[320px] ${openAbove ? 'origin-bottom' : ''}`}>
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
                                    key={`${option.value}-${option.label}`}
                                    type="button"
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${isSelected ? 'bg-slate-900 text-white shadow-lg' : 'hover:bg-slate-50 text-slate-700'}`}
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
            </div>
        </div>
        );
    })() : null;

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                type="button"
                disabled={disabled || loading}
                onClick={handleToggle}
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

            {typeof document !== 'undefined' && createPortal(dropdownContent, document.body)}
        </div>
    );
}
