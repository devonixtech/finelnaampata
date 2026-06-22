"use client";

import React from 'react';
import Link from 'next/link';
import { Star, CheckCircle2 } from 'lucide-react';
import { Business } from '../types/api';
import { ListingImage } from './ListingImage';

// ⭐ Rating Component
const RatingStars = ({ rating }: { rating: number }) => {
    return (
        <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-[#70757a]">
                {Number(rating || 0).toFixed(1)}
            </span>
            <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <Star 
                        key={i} 
                        className={`w-3.5 h-3.5 ${i < Math.round(rating || 0) ? 'fill-[#fbbc04] text-[#fbbc04]' : 'text-gray-200'}`} 
                    />
                ))}
            </div>
        </div>
    );
};

interface BusinessCardProps {
    business: Business;
}

const BusinessCard = React.memo(({ business }: BusinessCardProps) => {

    const isApproved = business.status === 'approved';

    // ✅ SAFE URL (IMPORTANT FIX)
    const businessUrl = business.slug
        ? `/business/${business.slug}`
        : `/business/${business.id}`; // fallback

    return (
        <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full hover:shadow-md transition">

            {/* Image */}
            <Link href={businessUrl}>
                <div className="relative h-[220px] w-full overflow-hidden">
                    <ListingImage
                        src={business.coverImageUrl}
                        alt={business.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                </div>
            </Link>

            {/* Content */}
            <div className="p-5 flex flex-col gap-4 flex-grow">

                {/* Title */}
                <Link href={businessUrl}>
                    <h3 className="text-lg font-medium text-[#1a0dab] group-hover:underline line-clamp-1 hover:underline">
                        {business.title}
                    </h3>
                </Link>

                {/* Status */}
                <div className="flex gap-2 flex-wrap">
                    {isApproved && (
                        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-600">
                            <CheckCircle2 className="w-4 h-4" />
                            Approved
                        </span>
                    )}
                    
                    {business.vendor?.isOnline ? (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            Online
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100">
                            <span className="w-2 h-2 bg-rose-500 rounded-full" />
                            Offline
                        </span>
                    )}
                </div>

                {/* Rating */}
                <RatingStars rating={business.averageRating || 0} />

                {/* Button */}
                <Link
                    href={businessUrl}
                    className="mt-auto w-full text-center py-2 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-[#3c4043] font-medium rounded-md text-sm transition"
                >
                    View Details
                </Link>

            </div>
        </div>
    );
});

export default BusinessCard;