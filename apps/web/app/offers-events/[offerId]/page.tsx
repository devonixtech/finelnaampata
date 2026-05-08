import React from 'react';
import { Metadata } from 'next';
import OfferEventDetailClient from './OfferEventDetailClient';
import { api } from '../../../lib/api';

export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
    try {
        // Fetch public offers to pre-render
        const response = await api.offers.search({ limit: 100 });
        const offers = response.data || [];
        
        const params = offers.map((offer: any) => ({
            offerId: offer.id,
        }));

        // Ensure important IDs and template are always included
        const essentialIds = [
            'placeholder',
            'template',
            'fe29dc46-d272-4b86-abe1-ae7c0613115d' // Specific ID from the error
        ];
        
        essentialIds.forEach(id => {
            if (!params.some(p => p.offerId === id)) {
                params.push({ offerId: id });
            }
        });

        return params;
    } catch (error) {
        console.error('[OfferEventDetail] Error generating static params:', error);
        return [
            { offerId: 'placeholder' },
            { offerId: 'template' },
            { offerId: 'fe29dc46-d272-4b86-abe1-ae7c0613115d' }
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
