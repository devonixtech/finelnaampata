"use client";

import React from 'react';
import Link from 'next/link';
import {
    BadgeCheck, Phone, Mail, Star, Building2,
    Facebook, Instagram, Twitter, Globe, Linkedin, Youtube,
} from 'lucide-react';
import BusinessAvatar from './BusinessAvatar';
import { getImageUrl } from '../lib/api';
import { getBusinessStatus } from '../lib/business-status';

const BusinessStatusBadge = ({ hours, isOnline }: { hours?: any[], isOnline?: boolean }) => {
    const { status, message, color } = getBusinessStatus(hours, isOnline);
    
    let colorClasses = "";
    switch(color) {
        case 'emerald': colorClasses = "bg-emerald-50 text-emerald-600 border-emerald-100"; break;
        case 'rose': colorClasses = "bg-rose-50 text-rose-600 border-rose-100"; break;
        case 'amber': colorClasses = "bg-amber-50 text-amber-600 border-amber-100"; break;
        default: colorClasses = "bg-slate-50 text-slate-600 border-slate-100";
    }

    return (
        <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${colorClasses}`}>
            {status === 'ONLINE' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
            {message}
        </div>
    );
};

interface SocialLink { platform: string; url: string; }

interface VendorProfile {
    id: string;
    slug: string;
    businessName: string;
    vendorName?: string;
    businessEmail?: string;
    businessPhone?: string;
    businessAddress?: string;
    isVerified: boolean;
    socialLinks?: SocialLink[];
    avatarUrl?: string | null;
    coverImage?: string | null;
    isOnline: boolean;
    listingCount: number;
    avgRating: number;
    totalViews: number;
    categories: string[];
    businessHours?: any[];
    sampleListings: { id: string; title: string; slug: string; images?: string[] }[];
}

interface Props {
    vendor: VendorProfile;
    city?: string;
}

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
    facebook: <Facebook className="w-4 h-4" />,
    instagram: <Instagram className="w-4 h-4" />,
    twitter: <Twitter className="w-4 h-4" />,
    linkedin: <Linkedin className="w-4 h-4" />,
    youtube: <Youtube className="w-4 h-4" />,
    website: <Globe className="w-4 h-4" />,
    globe: <Globe className="w-4 h-4" />,
};

const SOCIAL_COLORS: Record<string, string> = {
    facebook: 'hover:bg-blue-600 hover:border-blue-600 hover:text-white',
    instagram: 'hover:bg-pink-500 hover:border-pink-500 hover:text-white',
    twitter: 'hover:bg-sky-400   hover:border-sky-400  hover:text-white',
    linkedin: 'hover:bg-blue-700 hover:border-blue-700 hover:text-white',
    youtube: 'hover:bg-red-600  hover:border-red-600  hover:text-white',
    website: 'hover:bg-slate-700 hover:border-slate-700 hover:text-white',
    globe: 'hover:bg-slate-700 hover:border-slate-700 hover:text-white',
};

export default function VendorProfileCard({ vendor, city }: Props) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col">

            {/* ── Profile photo ── */}
            <div className="flex flex-col items-center pt-8 pb-4 px-5">
                <div className="relative mb-4">
                    <BusinessAvatar 
                        src={vendor.avatarUrl} 
                        alt={vendor.businessName} 
                        size="lg" 
                        className="shadow-lg ring-4 ring-white"
                    />
                </div>

                {/* Name */}
                <h3 className="font-black text-slate-900 text-base text-center leading-tight mb-0.5">
                    {vendor.vendorName || vendor.businessName}
                </h3>
                {vendor.businessName && (
                    <p className="text-xs text-slate-400 font-semibold text-center mb-3">{vendor.businessName}</p>
                )}

                {/* Categories pill */}
                <div className="flex flex-col items-center gap-2 mb-3">
                    {vendor.categories.length > 0 && (
                        <p className="text-[11px] font-bold text-orange-500 text-center">
                            {vendor.categories.slice(0, 2).join(' · ')}
                            {vendor.categories.length > 2 && ` +${vendor.categories.length - 2}`}
                        </p>
                    )}
                    <BusinessStatusBadge hours={vendor.businessHours} isOnline={vendor.isOnline} />
                </div>

                {/* ── Stats row ── */}
                <div className="flex items-center gap-5 mb-4">
                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-0.5">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            <span className="text-sm font-black text-slate-900">
                                {vendor.avgRating > 0 ? vendor.avgRating.toFixed(1) : '—'}
                            </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">Rating</span>
                    </div>
                    <div className="w-px h-7 bg-slate-100" />
                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-0.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-sm font-black text-slate-900">{vendor.listingCount}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">Listings</span>
                    </div>
                </div>

                {/* ── Divider ── */}
                <div className="w-full border-t border-slate-100 mb-4" />

                {/* ── Contact info ── */}
                <div className="w-full space-y-2 mb-4">
                    {vendor.businessPhone && (
                        <a
                            href={`tel:${vendor.businessPhone}`}
                            className="flex items-center gap-3 w-full px-3 py-2.5 bg-slate-50 rounded-xl hover:bg-orange-50 hover:text-orange-600 transition-colors group"
                        >
                            <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-orange-500 transition-colors">
                                <Phone className="w-3.5 h-3.5 text-orange-500 group-hover:text-white" />
                            </div>
                            <span className="text-sm font-bold text-slate-700 truncate group-hover:text-orange-600">
                                {vendor.businessPhone}
                            </span>
                        </a>
                    )}
                    {vendor.businessEmail && (
                        <a
                            href={`mailto:${vendor.businessEmail}`}
                            className="flex items-center gap-3 w-full px-3 py-2.5 bg-slate-50 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-colors group"
                        >
                            <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500 transition-colors">
                                <Mail className="w-3.5 h-3.5 text-blue-500 group-hover:text-white" />
                            </div>
                            <span className="text-sm font-bold text-slate-700 truncate group-hover:text-blue-600">
                                {vendor.businessEmail}
                            </span>
                        </a>
                    )}
                </div>

                {/* ── Social icons ── */}
                {vendor.socialLinks && vendor.socialLinks.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap justify-center mb-4">
                        {vendor.socialLinks.map((link, i) => {
                            const key = link.platform?.toLowerCase();
                            const icon = SOCIAL_ICONS[key] || <Globe className="w-4 h-4" />;
                            const colorClass = SOCIAL_COLORS[key] || SOCIAL_COLORS.globe;
                            return (
                                <a
                                    key={i}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={link.platform}
                                    className={`w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 transition-all duration-200 ${colorClass}`}
                                >
                                    {icon}
                                </a>
                            );
                        })}
                    </div>
                )}

                {/* ── CTA ── */}
                <Link
                    href={vendor.slug ? `/businesses/${encodeURIComponent(vendor.slug)}` : vendor.id ? `/businesses/${encodeURIComponent(vendor.id)}` : "#"}
                    className="block w-full text-center py-3 bg-gradient-to-r from-[#FF7A30] to-[#F5A623] hover:from-[#E86920] hover:to-[#E09010] text-white text-sm font-black rounded-xl transition-all active:scale-95 shadow-md shadow-orange-500/25"
                >
                    View Business
                </Link>
            </div>
        </div>
    );
}

