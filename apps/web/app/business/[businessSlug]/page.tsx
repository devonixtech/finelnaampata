import React from 'react';
import { Metadata } from 'next';
import BusinessDetailClient from './BusinessDetailClient';
import { api } from '../../../lib/api';

// Render all business pages dynamically on-demand (SSR) to avoid slow builds

export async function generateStaticParams() {
  try {
    const result = await api.listings.search({ limit: 500 });
    if (result?.data && result.data.length > 0) {
      return result.data
        .filter((b: any) => b.slug)
        .map((b: any) => ({ businessSlug: b.slug }));
    }
  } catch (error) {
    console.error('[generateStaticParams] Failed to fetch businesses:', error);
  }
  return [{ businessSlug: 'template' }];
}


export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ businessSlug: string }> 
}): Promise<Metadata> {
  try {
    const { businessSlug } = await params;
    
    // During build, if businessSlug is 'template' or similar, return default metadata
    if (businessSlug === 'template' || businessSlug === 'sample-business') {
        return { title: 'Business Details | naampata' };
    }

    const business = await api.listings.getBySlug(businessSlug, { silent: true });
    
    if (!business) {
      return {
        title: 'Business Details | naampata',
        description: 'Find local businesses in your neighborhood.'
      };
    }

    return {
      title: `${business.title} | ${business.city} | naampata`,
      description: business.description?.substring(0, 160) || `Find details about ${business.title} in ${business.city}.`,
      openGraph: {
        title: business.title,
        description: business.description,
        images: business.coverImageUrl ? [business.coverImageUrl] : [],
      }
    };
  } catch (error) {
    console.error('[Metadata] Error generating metadata:', error);
    return {
      title: 'Business Details | naampata',
    };
  }
}

export default async function BusinessDetailPage({ 
  params 
}: { 
  params: Promise<{ businessSlug: string }> 
}) {
  const { businessSlug } = await params;

  if (!businessSlug) {
      return <div>Invalid Business Slug</div>;
  }

  // For static export, this will be called during build time for each slug in generateStaticParams
  let business = null;
  try {
    business = await api.listings.getBySlug(businessSlug, { silent: true });
  } catch (err) {
    console.error(`[BusinessPage] Error fetching data for ${businessSlug}:`, err);
  }

  // Use || undefined to fix Type 'Business | null' is not assignable to type 'Business | undefined'
  return <BusinessDetailClient slug={businessSlug} initialData={business || undefined} />;
}
