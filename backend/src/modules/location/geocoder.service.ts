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
        if (apiKey) {
            try {
                const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(trimmed)}&key=${apiKey}`;
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    if (Array.isArray(data?.results) && data.results.length > 0) {
                        const result = data.results[0];
                        const location = result?.geometry?.location;
                        if (location) {
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
                    }
                }
            } catch (err) {
                this.logger.warn(`Google Geocoding failed: ${err.message}. Falling back to OpenStreetMap.`);
            }
        }

        // --- FREE FALLBACK: Nominatim OpenStreetMap API ---
        try {
            this.logger.log(`Using Nominatim OpenStreetMap fallback for geocoding address: "${trimmed}"`);
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&addressdetails=1&limit=1`;
            const response = await fetch(url, {
                headers: { 'User-Agent': 'BusinessDirectoryApp/1.0 (contact@businessdirectory.com)' }
            });
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data) && data.length > 0) {
                    const item = data[0];
                    const addr = item.address || {};
                    const city = addr.city || addr.town || addr.village || addr.suburb || addr.county || undefined;
                    const state = addr.state || addr.region || undefined;
                    const country = addr.country || undefined;
                    const postalCode = addr.postcode || undefined;
                    const streetAddress = addr.road ? `${addr.house_number || ''} ${addr.road}`.trim() : undefined;

                    return {
                        lat: Number(item.lat),
                        lng: Number(item.lon),
                        formattedAddress: String(item.display_name || trimmed),
                        city,
                        state,
                        postalCode,
                        country,
                        streetAddress,
                    };
                }
            }
        } catch (err) {
            this.logger.error(`Nominatim geocoding fallback failed: ${err.message}`);
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

