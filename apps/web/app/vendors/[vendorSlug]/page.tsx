import React from 'react';
import { permanentRedirect } from 'next/navigation';

export async function generateStaticParams() {
    try {
        const res = await fetch('https://local-business-listing-directory-production.up.railway.app/api/v1/businesses/search?limit=100');
        const data = await res.json();
        const results = data.data || data.results || [];
        return [
            { vendorSlug: 'template' },
            { vendorSlug: 'default' },
            ...results.map((b: any) => ({ vendorSlug: b.slug }))
        ];
    } catch (error) {
        console.error("Error generating static params for vendors:", error);
        return [
            { vendorSlug: 'template' },
            { vendorSlug: 'default' }
        ];
    }
}

export default async function VendorProfilePage({ params }: { params: Promise<{ vendorSlug: string }> }) {
    const { vendorSlug } = await params;
    permanentRedirect(`/businesses/${vendorSlug}`);
    return null;
}
