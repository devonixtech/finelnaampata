import React from 'react';
import { Metadata } from 'next';
import OfferEventDetailClient from './OfferEventDetailClient';
import { api } from '../../../lib/api';

export async function generateStaticParams() {
    try {
        const res = await fetch('https://local-business-listing-directory-production.up.railway.app/api/v1/offers/public/search?limit=100');
        const data = await res.json();
        const offers = data.data || [];
        // Add 'template' and 'placeholder' just in case as well
        const paths = [
            { offerId: 'template' },
            { offerId: 'placeholder' },
            ...offers.map((o: any) => ({ offerId: o.id }))
        ];
        return paths;
    } catch (error) {
        console.error("Error generating static params for offers:", error);
        return [
            { offerId: 'template' },
            { offerId: 'placeholder' }
        ];
    }
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
