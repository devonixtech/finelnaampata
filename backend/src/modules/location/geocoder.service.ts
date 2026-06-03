import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GeocodeInput {
    address: string;
    city?: string;
    country?: string;
}

export interface GeocodeResult {
    lat: number;
    lng: number;
    formattedAddress?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    streetAddress?: string;
}

@Injectable()
export class GeocoderService {
    private readonly logger = new Logger(GeocoderService.name);

    constructor(private readonly configService: ConfigService) {}

    buildCanonicalAddress(input: GeocodeInput): string {
        return [input.address, input.city, input.country]
            .map((value) => (value || '').trim())
            .filter(Boolean)
            .join(', ');
    }

    private getApiKey(): string | null {
        return (
            this.configService.get<string>('GOOGLE_GEOCODING_API_KEY') ||
            this.configService.get<string>('GOOGLE_MAPS_API_KEY') ||
            process.env.GOOGLE_GEOCODING_API_KEY ||
            process.env.GOOGLE_MAPS_API_KEY ||
            null
        );
    }

    async geocodeAddress(address: string): Promise<GeocodeResult | null> {
        const trimmed = (address || '').trim();
        if (!trimmed) return null;

        const apiKey = this.getApiKey();
        if (!apiKey) {
            this.logger.warn('GOOGLE_GEOCODING_API_KEY not configured; geocoding unavailable');
            return null;
        }

        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(trimmed)}&key=${apiKey}`;
        const response = await fetch(url);
        if (!response.ok) return null;

        const data = await response.json();
        if (!Array.isArray(data?.results) || data.results.length === 0) return null;

        const result = data.results[0];
        const location = result?.geometry?.location;
        if (!location) return null;

        const parsed = this.parseAddressComponents(result.address_components || []);

        return {
            lat: Number(location.lat),
            lng: Number(location.lng),
            formattedAddress: String(result.formatted_address || trimmed),
            city: parsed.city,
            state: parsed.state,
            postalCode: parsed.postalCode,
            country: parsed.country,
            streetAddress: parsed.streetAddress,
        };
    }

    private parseAddressComponents(components: any[]): {
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
        streetAddress?: string;
    } {
        let city = '';
        let state = '';
        let postalCode = '';
        let country = '';
        const streetParts: string[] = [];

        for (const component of components) {
            const types: string[] = component?.types || [];
            const longName = String(component?.long_name || '');

            if (types.includes('street_number') || types.includes('route')) {
                streetParts.push(longName);
            } else if (types.includes('locality')) {
                city = longName;
            } else if (types.includes('postal_town') && !city) {
                city = longName;
            } else if (types.includes('administrative_area_level_2') && !city) {
                city = longName;
            } else if (types.includes('administrative_area_level_1')) {
                state = longName;
            } else if (types.includes('postal_code')) {
                postalCode = longName;
            } else if (types.includes('country')) {
                country = longName;
            }
        }

        return {
            city: city || undefined,
            state: state || undefined,
            postalCode: postalCode || undefined,
            country: country || undefined,
            streetAddress: streetParts.length ? streetParts.join(' ') : undefined,
        };
    }
}

