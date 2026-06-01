import React from 'react';
import VendorProfileClient from './VendorProfileClient';
import { api } from '../../../lib/api';

export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
    try {
        const slugs = await api.businessProfiles.getAllSlugs();
        const params = (slugs || []).map(slug => ({ vendorSlug: slug }));

        // Ensure template, sample-vendor and reported failing IDs are included for fallbacks
        const essentials = [
            'sample-vendor',
            'template',
            'df194c67-03d8-41d1-ad6e-b4518e4a387d' // Fixes reported error
        ];

        essentials.forEach(slug => {
            if (!params.some(p => p.vendorSlug === slug)) {
                params.push({ vendorSlug: slug });
            }
        });

        return params;
    } catch (error) {
        console.error('[generateStaticParams] Error fetching business slugs:', error);
        return [
            { vendorSlug: 'sample-vendor' },
            { vendorSlug: 'template' },
            { vendorSlug: 'df194c67-03d8-41d1-ad6e-b4518e4a387d' }
        ];
    }
}

export async function generateMetadata({ params }: { params: Promise<{ vendorSlug: string }> }) {
    const { vendorSlug } = await params;
    return {
        title: `Business Profile | ${vendorSlug}`,
        description: 'View business details, services, and contact information.',
    };
}

export default async function VendorProfilePage({ params }: { params: Promise<{ vendorSlug: string }> }) {
    const { vendorSlug } = await params;
    return <VendorProfileClient slugOrId={vendorSlug} />;
}
