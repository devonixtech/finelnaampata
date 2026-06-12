import React from 'react';
import BusinessProfileClient from './BusinessProfileClient';

export async function generateStaticParams() {
    try {
        const res = await fetch('https://local-business-listing-directory-production.up.railway.app/api/v1/businesses/search?limit=100');
        const data = await res.json();
        const results = data.results || [];
        return [
            { businessSlug: 'template' },
            { businessSlug: 'default' },
            ...results.map((b: any) => ({ businessSlug: b.slug }))
        ];
    } catch (error) {
        console.error("Error generating static params for businesses:", error);
        return [
            { businessSlug: 'template' },
            { businessSlug: 'default' }
        ];
    }
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
