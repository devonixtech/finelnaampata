"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, LayoutGrid, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Category } from '../types/api';
import DynamicIcon from './DynamicIcon';

interface Props {
    categories: Category[];
    value: string;
    onChange: (categoryId: string) => void;
    loading?: boolean;
}

export default function CategorySearchSelect({ categories, value, onChange, loading }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);

    const selectedCategory = useMemo(() =>
        categories.find(c => c.id === value),
        [categories, value]);

    const filteredCategories = useMemo(() => {
        if (!search.trim()) return categories;
        const q = search.toLowerCase();
        return categories.filter(c =>
            c.name?.toLowerCase().includes(q) ||
            c.slug?.toLowerCase().includes(q)
        );
    }, [categories, search]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                // Check if they clicked inside the portal
                const portalNode = document.getElementById('category-portal-dropdown');
                if (portalNode && portalNode.contains(e.target as Node)) return;
                
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggle = () => {
        if (!loading) {
            if (!isOpen && containerRef.current) {
                setButtonRect(containerRef.current.getBoundingClientRect());
            }
            setIsOpen(!isOpen);
        }
    };

    const dropdownContent = isOpen && buttonRect ? (() => {
        const spaceBelow = window.innerHeight - buttonRect.bottom;
        const openAbove = spaceBelow < 340;
        const top = openAbove ? buttonRect.top - 8 : buttonRect.bottom + 8;
        return (
            <div id="category-portal-dropdown" className="fixed z-[9999]" style={{ top: openAbove ? 'auto' : top, bottom: openAbove ? window.innerHeight - buttonRect.top + 8 : 'auto', left: buttonRect.left, width: buttonRect.width }} onMouseDown={e => e.stopPropagation()}>
                <div className={`w-full bg-white border border-slate-100 rounded-2xl overflow-hidden flex flex-col max-h-[350px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] ${openAbove ? 'origin-bottom' : ''}`}>
                    <div className="p-4 border-b border-slate-50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search categories..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-slate-200"
                                onClick={e => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    <div className="flex-grow overflow-y-auto p-2 custom-scrollbar">
                        {filteredCategories.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No matching categories</p>
                            </div>
                        ) : (
                            filteredCategories.map(cat => {
                                const isSelected = cat.id === value;
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => {
                                            onChange(cat.id);
                                            setIsOpen(false);
                                            setSearch('');
                                        }}
                                        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all ${isSelected ? 'bg-slate-900 text-white shadow-lg' : 'hover:bg-slate-50 text-slate-700'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <DynamicIcon name={cat.icon} className="w-5 h-5" fallback="📁" />
                                            <div className="text-left">
                                                <p className="text-sm font-black">{cat.name}</p>
                                                <p className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-white/50' : 'text-slate-400'}`}>{cat.slug}</p>
                                            </div>
                                        </div>
                                        {isSelected && <Check className="w-4 h-4" />}
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
        <div className={`relative ${isOpen ? 'z-[120]' : 'z-10'}`} ref={containerRef}>
            <button
                type="button"
                onClick={handleToggle}
                className={`w-full flex items-center justify-between px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold text-sm focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all ${loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
                <div className="flex items-center gap-3">
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    ) : (
                        <div className="text-lg flex items-center justify-center">
                            {selectedCategory ? <DynamicIcon name={selectedCategory.icon} className="w-5 h-5 text-slate-600" /> : <LayoutGrid className="w-4 h-4 text-slate-400" />}
                        </div>
                    )}
                    <span className={!selectedCategory ? 'text-slate-400' : ''}>
                        {loading ? 'Loading categories...' : selectedCategory?.name || '-- Select Category --'}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {typeof document !== 'undefined' && createPortal(dropdownContent, document.body)}
        </div>
    );
}
