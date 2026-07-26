import React from 'react';
import { permanentRedirect } from 'next/navigation';


export default async function VendorProfilePage({ params }: { params: Promise<{ vendorSlug: string }> }) {
    const { vendorSlug } = await params;
    permanentRedirect(`/businesses/${vendorSlug}`);
    return null;
}
