import React from 'react';
import { permanentRedirect } from 'next/navigation';
import { api } from '../../../lib/api';

export const dynamicParams = true;

export async function generateStaticParams() {
    try {
        const result = await api.listings.search({ limit: 500 });
        if (result?.data && result.data.length > 0) {
            const slugs = result.data
                .filter((b: any) => b.vendor?.slug)
                .map((b: any) => ({ vendorSlug: b.vendor.slug }));
            const unique = [...new Map(slugs.map((s: any) => [s.vendorSlug, s])).values()];
            return unique.length > 0 ? unique : [{ vendorSlug: 'template' }];
        }
    } catch (error) {
        console.error('[generateStaticParams] Failed to fetch vendor slugs:', error);
    }
    return [{ vendorSlug: 'template' }];
}

export default async function VendorProfilePage({ params }: { params: Promise<{ vendorSlug: string }> }) {
    const { vendorSlug } = await params;
    permanentRedirect(`/businesses/${vendorSlug}`);
    return null;
}
