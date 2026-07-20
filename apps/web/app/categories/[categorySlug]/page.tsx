import React from 'react';
import { Metadata } from 'next';
import CategoryDetailClient from './CategoryDetailClient';
import { api } from '../../../lib/api';




// Render all category pages dynamically on-demand (SSR) to avoid building 25,000+ static pages at build time
export const dynamicParams = true;
export async function generateStaticParams() {
    return [];
}

// Dynamic route handling for categories

export async function generateMetadata({ 
    params 
}: { 
    params: Promise<{ categorySlug: string }> 
}): Promise<Metadata> {
    const { categorySlug } = await params;
    
    try {
        const category = await api.categories.getBySlug(categorySlug, { silent: true });
        
        if (!category) {
            return {
                title: 'Category Not Found | naampata',
            };
        }

        return {
            title: `${category.name} | Local Businesses in Pakistan | naampata`,
            description: category.description || `Browse the best ${category.name} in Pakistan. Find contact details, reviews, and more.`,
        };
    } catch (error) {
        return {
            title: 'Browse Categories | naampata',
        };
    }
}

export default async function CategoryPage({ 
    params 
}: { 
    params: Promise<{ categorySlug: string }> 
}) {
    const { categorySlug } = await params;
    
    return <CategoryDetailClient slug={categorySlug} />;
}
