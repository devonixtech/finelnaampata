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

import { createPortal } from 'react-dom';

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
        const modalContent = (
            <AnimatePresence>
                {isOpen && (
                    <div 
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-12 bg-slate-950/95 backdrop-blur-2xl"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(false);
                        }}
                    >
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                            }}
                            className="absolute top-6 right-6 z-[210] p-3 bg-white/10 hover:bg-white/25 text-white rounded-full backdrop-blur-md transition-all border border-white/10 shadow-2xl"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-full h-full flex flex-col items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={imageUrl}
                                alt={alt}
                                className="w-full h-full max-h-[85vh] object-contain select-none drop-shadow-2xl rounded-xl"
                            />
                            {alt && (
                                <div className="mt-6 px-6 py-2.5 bg-white/10 backdrop-blur-md rounded-full text-white/90 font-medium text-sm select-none border border-white/10 shadow-xl">
                                    {alt}
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        );

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

                {typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null}
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
