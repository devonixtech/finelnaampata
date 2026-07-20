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

    async autocomplete(
        input: string,
        sessionToken: string,
        countryCode?: string,
    ): Promise<PlaceAutocompleteItem[]> {
        const trimmed = this.sanitizePlaceText(input);
        if (trimmed.length < 3) return [];

        try {
            const params = new URLSearchParams({
                q: trimmed,
                limit: '5',
            });

            // Photon doesn't strictly support `countryCode` filter out of the box in the same way,
            // but you can append it to the search query for better localized results if needed.
            // Leaving it out for broad results, as OSM covers it well.

            const url = `https://photon.komoot.io/api/?${params.toString()}`;
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data?.features)) {
                    return data.features.map((feature: any) => {
                        const props = feature.properties;
                        // Build a nice description
                        const parts = [props.name, props.street, props.city || props.county, props.state, props.country].filter(Boolean);
                        // Filter duplicates like 'Karachi, Karachi'
                        const uniqueParts = Array.from(new Set(parts));
                        return {
                            placeId: String(props.osm_id || Math.random()),
                            description: uniqueParts.join(', '),
                        };
                    });
                }
            }
        } catch (err: any) {
            this.logger.error(`Photon autocomplete failed: ${err.message}`);
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
