import React from 'react';
import CityVendorsClient from './CityVendorsClient';

import { api } from '../../../lib/api';




// Render all city pages dynamically on-demand (SSR) to avoid building thousands of static pages at build time
export const dynamicParams = true;
export async function generateStaticParams() {
    return [];
}

export default async function CityPage({ params }: { params: Promise<{ cityName: string }> }) {
    const { cityName } = await params;
    
    return <CityVendorsClient city={cityName} />;
}
