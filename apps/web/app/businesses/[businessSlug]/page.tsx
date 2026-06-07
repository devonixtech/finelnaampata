import BusinessProfileClient from './BusinessProfileClient';





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
    return <BusinessProfileClient slugOrId={businessSlug} />;
}
