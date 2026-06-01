import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type PlaceAutocompleteItem = {
    placeId: string;
    description: string;
};

export type PlaceDetailsResult = {
    placeId: string;
    formattedAddress: string;
    latitude: number;
    longitude: number;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    streetAddress?: string;
};

@Injectable()
export class PlacesService {
    private readonly logger = new Logger(PlacesService.name);

    constructor(private readonly configService: ConfigService) {}

    sanitizePlaceText(value?: string | null): string {
        return (value || '').trim();
    }

    private getApiKey(): string | null {
        return (
            this.configService.get<string>('GOOGLE_MAPS_API_KEY') ||
            this.configService.get<string>('GOOGLE_PLACES_API_KEY') ||
            process.env.GOOGLE_MAPS_API_KEY ||
            null
        );
    }

    async autocomplete(
        input: string,
        sessionToken: string,
        countryCode?: string,
    ): Promise<PlaceAutocompleteItem[]> {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            this.logger.warn('GOOGLE_MAPS_API_KEY not configured — Places autocomplete unavailable');
            return [];
        }

        const trimmed = this.sanitizePlaceText(input);
        if (trimmed.length < 3) return [];

        const params = new URLSearchParams({
            input: trimmed,
            sessiontoken: sessionToken,
            key: apiKey,
            types: 'address',
        });

        const cc = (countryCode || '').trim().toUpperCase();
        if (cc && cc.length === 2) {
            params.set('components', `country:${cc.toLowerCase()}`);
        }

        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new ServiceUnavailableException('Places autocomplete request failed');
        }

        const data = await response.json();
        if (data.status === 'ZERO_RESULTS') return [];
        if (data.status !== 'OK' && data.status !== 'INVALID_REQUEST') {
            this.logger.warn(`Places autocomplete status: ${data.status} — ${data.error_message || ''}`);
            if (data.status === 'REQUEST_DENIED') return [];
        }

        const predictions = Array.isArray(data.predictions) ? data.predictions : [];
        return predictions.map((p: any) => ({
            placeId: String(p.place_id),
            description: String(p.description || ''),
        }));
    }

    async getPlaceDetails(
        placeId: string,
        sessionToken: string,
    ): Promise<PlaceDetailsResult | null> {
        const apiKey = this.getApiKey();
        if (!apiKey) return null;

        const params = new URLSearchParams({
            place_id: placeId,
            sessiontoken: sessionToken,
            key: apiKey,
            fields: 'place_id,formatted_address,geometry,address_component',
        });

        const url = `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`;
        const response = await fetch(url);
        if (!response.ok) return null;

        const data = await response.json();
        if (data.status !== 'OK' || !data.result) return null;

        const result = data.result;
        const location = result.geometry?.location;
        if (!location) return null;

        const parsed = this.parseAddressComponents(result.address_components || []);

        return {
            placeId: String(result.place_id || placeId),
            formattedAddress: String(result.formatted_address || ''),
            latitude: Number(location.lat),
            longitude: Number(location.lng),
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
            const types: string[] = component.types || [];
            const longName = String(component.long_name || '');

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
