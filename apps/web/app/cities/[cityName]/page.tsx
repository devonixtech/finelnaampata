import React from 'react';
import CityVendorsClient from './CityVendorsClient';

import { api } from '../../../lib/api';




// ✅ Added generateStaticParams for static export support
export async function generateStaticParams() {
    try {
        const res = await fetch('https://local-business-listing-directory-production.up.railway.app/api/v1/cities');
        const json = await res.json();
        const cities = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
        const paths: { cityName: string }[] = [
            { cityName: 'template' },
            { cityName: 'default' }
        ];
        cities.forEach((city: any) => {
            if (city.slug) paths.push({ cityName: city.slug });
            if (city.name) paths.push({ cityName: city.name.toLowerCase() });
        });
        return paths;
    } catch (error) {
        console.error("Error generating static params for cities:", error);
        return [
            { cityName: 'template' },
            { cityName: 'default' }
        ];
    }
}

export default async function CityPage({ params }: { params: Promise<{ cityName: string }> }) {
    const { cityName } = await params;
    
    return <CityVendorsClient city={cityName} />;
}
