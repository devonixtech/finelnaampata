'use client';

import React from 'react';
import { Megaphone, Calendar, Tag, Clock } from 'lucide-react';
import Link from 'next/link';

interface OfferCardProps {
    offer: {
        id: string;
        title: string;
        description?: string;
        type: 'offer' | 'event';
        offerBadge?: string;
        imageUrl?: string;
        expiryDate?: string;
        business?: {
            id: string;
            title: string;
            slug: string;
        };
        isFeatured?: boolean;
    };
    onEnquire?: () => void;
}

const OfferCard: React.FC<OfferCardProps> = React.memo(({ offer, onEnquire }) => {
    return (
        <div className="group relative bg-white rounded-3xl border shadow-sm hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 overflow-hidden flex flex-col h-full border-slate-100">
            <div className="h-1.5 w-full bg-gradient-to-r  to-rose-500" />
            {/* Offer Banner Image */}
            {offer.imageUrl && (
                <Link href={`/offers-events/${offer.id}`}>
                    <div className="h-40 overflow-hidden bg-slate-100">
                        <img
                            src={offer.imageUrl}
                            alt={offer.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    </div>
                </Link>
            )}

            <div className="p-6 flex flex-col flex-1 gap-3">
                {/* Header info (Badge and Type) */}
                <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${offer.type === 'event' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                        }`}>
                        {offer.type === 'event' ? <Calendar className="w-3 h-3" /> : <Tag className="w-3 h-3" />}
                        {offer.type}
                    </span>

                    {offer.offerBadge && (
                        <span className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[10px] font-black rounded-xl shadow-sm shadow-orange-500/30 uppercase tracking-wider">
                            {offer.offerBadge}
                        </span>
                    )}
                </div>

                {/* Business name link (if provided) */}
                {offer.business && (
                    <Link
                        href={`/business/${offer.business.slug}`}
                        className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-orange-500 transition-colors"
                    >
                        {offer.business.title}
                    </Link>
                )
                }

                <Link href={`/offers-events/${offer.id}`}>
                    <h3 className="font-black text-slate-900 text-lg leading-tight group-hover:text-orange-500 transition-colors">{offer.title}</h3>
                </Link>

                {offer.description && (
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">{offer.description}</p>
                )}

                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                    {offer.expiryDate ? (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Valid until</span> {new Date(offer.expiryDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })}
                        </div>
                    ) : (
                        <div />
                    )}

                    <button
                        onClick={onEnquire}
                        className="px-4 py-2 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-orange-500 transition-all group-hover:scale-105 active:scale-95"
                    >
                        Enquire
                    </button>
                </div>
            </div>
        </div >
    );
});

export default OfferCard;
