"use client";

import React, { useState } from 'react';
import { Images, X, ZoomIn } from 'lucide-react';
import { getImageUrl } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';

interface ListingImageProps {
    src?: string | null;
    alt: string;
    className?: string;
    iconSize?: number;
    aspectRatio?: string;
}

export function ListingImage({ 
    src, 
    alt, 
    className = "w-full h-full object-cover", 
    iconSize = 24,
    aspectRatio
}: ListingImageProps) {
    const [error, setError] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const imageUrl = getImageUrl(src);

    if (imageUrl && !error) {
        return (
            <>
                <div 
                    className="relative w-full h-full group/img cursor-pointer overflow-hidden"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsOpen(true);
                    }}
                    style={aspectRatio ? { aspectRatio } : undefined}
                >
                    <img
                        src={imageUrl}
                        alt={alt}
                        className={className}
                        onError={() => setError(true)}
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <div className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg text-slate-800">
                            <ZoomIn className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {isOpen && (
                        <div 
                            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                            }}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                                className="relative max-w-5xl max-h-[90vh] w-auto h-auto rounded-3xl overflow-hidden shadow-2xl bg-slate-900 border border-white/10"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsOpen(false);
                                    }}
                                    className="absolute top-4 right-4 z-10 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all border border-white/10 shadow-lg"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                                <img
                                    src={imageUrl}
                                    alt={alt}
                                    className="w-full h-full max-h-[85vh] object-contain select-none"
                                />
                                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white font-bold text-sm select-none">
                                    {alt}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </>
        );
    }

    return (
        <div 
            className={`flex flex-col items-center justify-center bg-slate-100 text-slate-300 gap-2 ${className}`}
            style={aspectRatio ? { aspectRatio } : undefined}
        >
            <Images style={{ width: iconSize, height: iconSize }} className="opacity-20" />
            <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40">No Image</span>
        </div>
    );
}
