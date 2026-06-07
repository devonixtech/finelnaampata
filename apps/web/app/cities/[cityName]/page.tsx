import React from 'react';
import CityVendorsClient from './CityVendorsClient';

import { api } from '../../../lib/api';




// ✅ Added generateStaticParams for static export support

export default async function CityPage({ params }: { params: Promise<{ cityName: string }> }) {
    const { cityName } = await params;
    
    return <CityVendorsClient city={cityName} />;
}
