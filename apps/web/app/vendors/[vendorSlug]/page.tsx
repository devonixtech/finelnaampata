import React from 'react';
import { permanentRedirect } from 'next/navigation';

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ vendorSlug: 'template' }];
}

export default async function VendorProfilePage({ params }: { params: Promise<{ vendorSlug: string }> }) {
    const { vendorSlug } = await params;
    permanentRedirect(`/businesses/${vendorSlug}`);
    return null;
}
