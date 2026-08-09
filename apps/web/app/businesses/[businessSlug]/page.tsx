import React from 'react';
import BusinessProfileClient from './BusinessProfileClient';
import { api } from '../../../lib/api';
import CategoriesSidebar from '../../../components/CategoriesSidebar';

export const dynamicParams = true;

export async function generateStaticParams() {
    try {
        const result = await api.listings.search({ limit: 500 });
        if (result?.data && result.data.length > 0) {
            const slugs = result.data
                .filter((b: any) => b.vendor?.slug)
                .map((b: any) => ({ businessSlug: b.vendor.slug }));
            const unique = [...new Map(slugs.map((s: any) => [s.businessSlug, s])).values()];
            return unique.length > 0 ? unique : [{ businessSlug: 'template' }];
        }
    } catch (error) {
        console.error('[generateStaticParams] Failed to fetch vendor slugs:', error);
    }
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
    
    let categories: any[] = [];
    try {
        categories = await api.categories.getRoot({ silent: true }) || [];
    } catch (err) {
        console.error(`[BusinessProfilePage] Error fetching categories:`, err);
    }

    return (
        <BusinessProfileClient slugOrId={businessSlug} initialCategories={categories} />
    );
}
