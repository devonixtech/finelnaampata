import VendorProfileClient from '../../vendors/[vendorSlug]/VendorProfileClient';

export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
    try {
        const { api } = await import('../../../lib/api');
        const slugs = await api.businessProfiles.getAllSlugs();
        const params = (slugs || []).map((slug) => ({ businessSlug: slug }));

        ['sample-vendor', 'template', 'df194c67-03d8-41d1-ad6e-b4518e4a387d'].forEach((slug) => {
            if (!params.some((p) => p.businessSlug === slug)) {
                params.push({ businessSlug: slug });
            }
        });

        return params;
    } catch {
        return [
            { businessSlug: 'sample-vendor' },
            { businessSlug: 'template' },
            { businessSlug: 'df194c67-03d8-41d1-ad6e-b4518e4a387d' },
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

/** Canonical public business profile route (alias of legacy /vendors/[slug]). */
export default async function BusinessProfilePage({ params }: { params: Promise<{ businessSlug: string }> }) {
    const { businessSlug } = await params;
    return <VendorProfileClient slugOrId={businessSlug} />;
}
