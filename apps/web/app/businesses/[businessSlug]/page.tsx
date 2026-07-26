import React from 'react';
import BusinessProfileClient from './BusinessProfileClient';

export const dynamicParams = false;

export function generateStaticParams() {
    return [{ businessSlug: 'template' }];
}

export async function generateMetadata({ params }: { params: Promise<{ businessSlug: string }> }) {
    const { businessSlug } = await params;
    return {
        title: `Business Profile | ${businessSlug}`,
        description: 'View business details, services, and contact information.',
    };
}

export default async function BusinessProfilePage({ params }: { params: Promise<{ businessSlug: string }> }) {
    const { businessSlug } = await params;
    return <BusinessProfileClient slugOrId={businessSlug} />;
}
