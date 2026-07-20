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

        try {
            const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=1`;
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data?.features) && data.features.length > 0) {
                    const feature = data.features[0];
                    const props = feature.properties;
                    const coords = feature.geometry.coordinates; // [lng, lat]

                    const parts = [props.name, props.street, props.city, props.state, props.country].filter(Boolean);
                    const formattedAddress = Array.from(new Set(parts)).join(', ');

                    return {
                        lat: Number(coords[1]),
                        lng: Number(coords[0]),
                        formattedAddress: formattedAddress || trimmed,
                        city: props.city || props.county,
                        state: props.state,
                        postalCode: props.postcode,
                        country: props.country,
                        streetAddress: props.street || props.name,
                    };
                }
            }
        } catch (err: any) {
            this.logger.error(`Photon geocoding failed for "${trimmed}": ${err.message}`);
        }

        return null;
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

