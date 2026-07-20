import React from 'react';
import { Metadata } from 'next';
import OfferEventDetailClient from './OfferEventDetailClient';
import { api } from '../../../lib/api';

// Render all offer/event pages dynamically on-demand (SSR) to avoid slow builds
export const dynamicParams = true;
export async function generateStaticParams() {
    return [];
}





export async function generateMetadata({ 
    params 
}: { 
    params: Promise<{ offerId: string }> 
}): Promise<Metadata> {
    try {
        const { offerId } = await params;
        
        if (offerId === 'template' || offerId === 'placeholder') {
            return { title: 'Offer Details | naampata' };
        }

        const offer = await api.offers.getById(offerId);
        
        if (!offer) {
            return { title: 'Offer Not Found | naampata' };
        }

        return {
            title: `${offer.title} | ${offer.business?.title} | naampata`,
            description: offer.description?.substring(0, 160) || `Exclusive offer from ${offer.business?.title}. Check details on naampata.`,
        };
    } catch (error) {
        return { title: 'Offer Details | naampata' };
    }
}

export default async function OfferEventDetailPage({ params }: { params: Promise<{ offerId: string }> }) {
    const { offerId } = await params;
    
    return <OfferEventDetailClient />;
}
