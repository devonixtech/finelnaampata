import { Injectable } from '@nestjs/common';

export interface GeocodeInput {
    address: string;
    city?: string;
    country?: string;
}

@Injectable()
export class GeocoderService {
    buildCanonicalAddress(input: GeocodeInput): string {
        return [input.address, input.city, input.country]
            .map((value) => (value || '').trim())
            .filter(Boolean)
            .join(', ');
    }

    async geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
        // Mock implementation. In production, call Google Maps Geocoding API or similar.
        return { lat: 30.3753, lng: 69.3451 };
    }
}

