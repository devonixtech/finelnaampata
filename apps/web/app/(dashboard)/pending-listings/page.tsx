"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Legacy route — listings are auto-approved; send users to My Listings. */
export default function PendingListingsRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/listings');
    }, [router]);

    return null;
}
