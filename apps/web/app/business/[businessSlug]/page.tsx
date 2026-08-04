import { Metadata } from 'next';
import BusinessDetailClient from './BusinessDetailClient';
import CategoriesSidebar from './CategoriesSidebar';
import { api } from '../../../lib/api';
import Navbar from '../../../components/Navbar';

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <CategoriesSidebar initialCategories={categories} />

        {/* Right Main Content */}
        <main className="flex-1 w-full lg:max-w-[calc(100vw-20rem)] overflow-y-auto">
          <BusinessDetailClient slug={businessSlug} initialData={business || undefined} />
        </main>
      </div>
    </div>
  );
}
