import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeocoderService } from './geocoder.service';

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

    constructor(
        private readonly configService: ConfigService,
        private readonly geocoderService: GeocoderService,
    ) {}

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
        const trimmed = this.sanitizePlaceText(input);
        if (trimmed.length < 3) return [];

        const apiKey = this.getApiKey();
        if (!apiKey) {
            this.logger.warn('Google Places API key is missing. Returning no autocomplete suggestions instead of using a non-Google fallback.');
            return [];
        }

        try {
            const params = new URLSearchParams({
                input: trimmed,
                sessiontoken: sessionToken,
                key: apiKey,
            });

            const cc = (countryCode || '').trim().toUpperCase();
            if (cc && cc.length === 2) {
                params.set('components', `country:${cc.toLowerCase()}`);
            }

            const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`;
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                if (data.status === 'OK' && Array.isArray(data.predictions) && data.predictions.length > 0) {
                    return data.predictions.map((p: any) => ({
                        placeId: String(p.place_id),
                        description: String(p.description || ''),
                    }));
                }
            }
        } catch (err) {
            this.logger.error(`Google Places autocomplete failed: ${err.message}`);
        }

        return [];
    }

    async resolveSelectedAddress(
        description: string,
        sessionToken: string,
    ): Promise<PlaceDetailsResult | null> {
        void sessionToken;
        const resolved = await this.geocoderService.geocodeAddress(description);
        if (!resolved) return null;

        return {
            placeId: this.sanitizePlaceText(description),
            formattedAddress: resolved.formattedAddress || this.sanitizePlaceText(description),
            latitude: resolved.lat,
            longitude: resolved.lng,
            city: resolved.city,
            state: resolved.state,
            postalCode: resolved.postalCode,
            country: resolved.country,
            streetAddress: resolved.streetAddress,
        };
    }
}
