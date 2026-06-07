import { Injectable, Logger } from '@nestjs/common';

type NominatimAddress = {
  house_number?: string;
  road?: string;
  pedestrian?: string;
  footway?: string;
  path?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state_district?: string;
  state?: string;
  region?: string;
  province?: string;
  postcode?: string;
  country?: string;
};

type NominatimPlace = {
  place_id?: number;
  osm_type?: string;
  osm_id?: number;
  display_name?: string;
  lat?: string;
  lon?: string;
  address?: NominatimAddress;
};

export type PlaceSuggestion = {
  placeId: string;
  description: string;
};

export type PlaceDetails = {
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
  private readonly searchUrl = 'https://nominatim.openstreetmap.org/search';

  async autocomplete(input: string, countryCode?: string): Promise<PlaceSuggestion[]> {
    const rows = await this.search(input, countryCode, 8);
    return rows
      .filter((place) => place.display_name)
      .map((place, index) => ({
        placeId: this.getPlaceId(place, index),
        description: place.display_name!,
      }));
  }

  async resolve(description: string): Promise<PlaceDetails | null> {
    const [place] = await this.search(description, undefined, 1);
    if (!place?.display_name || !place.lat || !place.lon) {
      return null;
    }

    const address = place.address || {};
    return {
      placeId: this.getPlaceId(place, 0),
      formattedAddress: place.display_name,
      latitude: Number(place.lat),
      longitude: Number(place.lon),
      city: address.city || address.town || address.village || address.municipality || address.county,
      state: address.state || address.region || address.province || address.state_district,
      postalCode: address.postcode,
      country: address.country,
      streetAddress: this.getStreetAddress(address, place.display_name),
    };
  }

  private async search(input: string, countryCode?: string, limit = 5): Promise<NominatimPlace[]> {
    const query = input.trim();
    if (query.length < 3) {
      return [];
    }

    const params = new URLSearchParams({
      q: query,
      format: 'jsonv2',
      addressdetails: '1',
      dedupe: '1',
      limit: String(limit),
    });

    if (countryCode && /^[a-z]{2}$/i.test(countryCode)) {
      params.set('countrycodes', countryCode.toLowerCase());
    }

    try {
      const response = await fetch(`${this.searchUrl}?${params.toString()}`, {
        headers: {
          'User-Agent': 'naampata-business-directory/1.0',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        this.logger.warn(`Nominatim returned ${response.status} for address search`);
        return [];
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      this.logger.warn(`Address search failed: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  private getPlaceId(place: NominatimPlace, index: number): string {
    return String(place.place_id || `${place.osm_type || 'place'}-${place.osm_id || index}`);
  }

  private getStreetAddress(address: NominatimAddress, formattedAddress: string): string {
    const road = address.road || address.pedestrian || address.footway || address.path;
    const streetParts = [address.house_number, road].filter(Boolean);
    if (streetParts.length > 0) {
      return streetParts.join(' ');
    }

    return formattedAddress
      .split(',')
      .slice(0, 2)
      .map((part) => part.trim())
      .filter(Boolean)
      .join(', ');
  }
}
