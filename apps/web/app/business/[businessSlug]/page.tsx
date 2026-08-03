import React from 'react';
import { Metadata } from 'next';
import BusinessDetailClient from './BusinessDetailClient';
import { api } from '../../../lib/api';

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

  let business = null;
  let categories: any[] = [];
  try {
    const [businessRes, categoriesRes] = await Promise.all([
      api.listings.getBySlug(businessSlug, { silent: true }),
      api.categories.getAll({ silent: true })
    ]);
    business = businessRes;
    categories = categoriesRes || [];
  } catch (err) {
    console.error(`[BusinessPage] Error fetching data for ${businessSlug}:`, err);
  }

  // Google Business Style Split Layout
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Sidebar (Categories) - Hidden on Mobile */}
      <aside className="hidden lg:flex w-80 flex-col bg-white border-r border-gray-200 h-screen sticky top-0 overflow-y-auto pt-20">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Categories</h2>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search categories..." 
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        <div className="flex-1 py-2">
          {categories.map((category: any) => (
            <a 
              key={category.id} 
              href={`/search?category=${category.slug}`}
              className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 group border-l-4 border-transparent hover:border-blue-500 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{category.name}</h3>
                  <p className="text-xs text-gray-500">{category.businessCount || 0} businesses</p>
                </div>
              </div>
              <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          ))}
        </div>
        <div className="p-4 border-t border-gray-100 text-center">
          <a href="/categories" className="text-sm font-medium text-blue-600 hover:text-blue-700">View all categories</a>
        </div>
      </aside>

      {/* Right Main Content */}
      <main className="flex-1 w-full lg:max-w-[calc(100vw-20rem)] overflow-x-hidden pt-16">
        <BusinessDetailClient slug={businessSlug} initialData={business || undefined} />
      </main>
    </div>
  );
}
