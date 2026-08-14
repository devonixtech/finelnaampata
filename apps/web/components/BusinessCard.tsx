"use client";

import React from 'react';
import Link from 'next/link';
import { Star, Heart, MapPin, Phone, Send } from 'lucide-react';
import { Business } from '../types/api';
import { ListingImage } from './ListingImage';

import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api';
import { getBusinessOpenStatus } from '../lib/business-status';

const RatingStars = ({ rating, count }: { rating: number, count?: number }) => {
    return (
        <div className="flex items-center gap-2 mt-1 mb-4">
            <span className="text-sm font-black text-slate-900">
                {Number(rating || 0).toFixed(1)}
            </span>
            <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <Star 
                        key={i} 
                        className={`w-3.5 h-3.5 ${i < Math.round(rating || 0) ? 'fill-[#fbbc04] text-[#fbbc04]' : 'text-slate-200'}`} 
                    />
                ))}
            </div>
            {count !== undefined && (
                <span className="text-xs text-slate-400 font-medium ml-1">
                    ({count} reviews)
                </span>
            )}
        </div>
    );
};

interface BusinessCardProps {
    business: Business;
}

const BusinessCard = React.memo(({ business }: BusinessCardProps) => {
    const { user } = useAuth();
    const router = useRouter();
    const [isFavorite, setIsFavorite] = React.useState(false);
    
    // Check initial favorite state if needed, though without user context on list fetch, it might be false by default
    // We keep it simple for now as requested.

    const businessUrl = business.slug
        ? `/business/${business.slug}`
        : `/business/${business.id}`; 
        
    const categoryName = typeof business.category === 'object' ? business.category?.name : business.category;
    const locationParts = [categoryName, business.city].filter(Boolean);
    const locationString = locationParts.join(' • ');
    
    // Check actual business hours
    const openStatus = getBusinessOpenStatus(business.businessHours);
    const isOpen = openStatus.status !== 'CLOSED';

    const handleAction = async (e: React.MouseEvent, action: 'like' | 'call' | 'enquiry') => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            // For Call and Enquiry, we want to redirect the user to the business page after login
            // so they don't lose context. For 'like', redirecting to the current page is fine.
            const redirectUrl = (action === 'call' || action === 'enquiry') ? businessUrl : window.location.pathname;
            router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
            return;
        }

        if (action === 'like') {
            try {
                if (isFavorite) {
                    await api.users.removeFavorite(business.id);
                    setIsFavorite(false);
                } else {
                    await api.users.addFavorite(business.id);
                    setIsFavorite(true);
                }
            } catch (err) {
                console.error("Failed to toggle favorite:", err);
            }
        } else {
            // For Call and Send, just navigate to details page since the modals are there
            router.push(businessUrl);
        }
    };

    return (
        <div className="bg-white rounded-[24px] border border-slate-100/60 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-200 transition-all duration-300 overflow-hidden flex flex-col h-full group">

            {/* Image Section */}
            <div className="relative w-full aspect-[16/10] overflow-hidden bg-slate-50 cursor-pointer" onClick={() => router.push(businessUrl)}>
                <ListingImage
                    src={business.coverImageUrl}
                    alt={business.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <button 
                    onClick={(e) => handleAction(e, 'like')}
                    className="absolute top-4 right-4 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform z-10"
                >
                    <Heart className={`w-4 h-4 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-400 hover:text-red-500'}`} />
                </button>
            </div>

            {/* Content Section */}
            <div className="p-5 flex flex-col flex-grow">
                
                {/* Status Pill */}
                <div className="mb-3">
                    {isOpen ? (
                        <span className="inline-flex px-3 py-1 bg-[#e6f4ea] text-[#137333] rounded-full text-[10px] font-black tracking-wide">
                            Open Now
                        </span>
                    ) : (
                        <span className="inline-flex px-3 py-1 bg-[#fce8e6] text-[#c5221f] rounded-full text-[10px] font-black tracking-wide">
                            Closed Now
                        </span>
                    )}
                </div>

                {/* Title */}
                <Link href={businessUrl}>
                    <h3 className="text-lg font-black text-slate-900 line-clamp-1 mb-1.5 hover:text-blue-600 transition-colors">
                        {business.title}
                    </h3>
                </Link>

                {/* Location */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2 font-medium">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{locationString}</span>
                </div>

                {/* Rating */}
                <RatingStars rating={business.averageRating || 0} count={business.totalReviews || 0} />

                {/* Action Buttons */}
                <div className="mt-auto pt-2 flex items-center gap-2">
                    <button 
                        onClick={(e) => handleAction(e, 'call')}
                        className="w-10 h-10 shrink-0 border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                        <Phone className="w-4 h-4" />
                    </button>
                    <Link 
                        href={businessUrl} 
                        className="flex-grow h-10 border border-slate-200 rounded-xl flex items-center justify-center text-xs font-black text-[#1a0dab] hover:bg-slate-50 transition-colors"
                    >
                        View Details
                    </Link>
                    <button 
                        onClick={(e) => handleAction(e, 'enquiry')}
                        className="w-10 h-10 shrink-0 bg-[#2563eb] rounded-xl flex items-center justify-center text-white hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5"
                    >
                        <Send className="w-4 h-4 ml-[-2px]" />
                    </button>
                </div>

            </div>
        </div>
    );
});

export default BusinessCard;