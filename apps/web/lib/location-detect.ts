import { City } from '../types/api';

export type GeoCoords = { latitude: number; longitude: number };

/** Device GPS only - consistent across all location pickers. */
export function detectDeviceLocation(): Promise<GeoCoords> {
    return new Promise((resolve, reject) => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            () => {
                reject(new Error('Unable to detect GPS location'));
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
        );
    });
}

export type GpsDetectResult =
    | { ok: true; coords: GeoCoords }
    | { ok: false; reason: 'unsupported' | 'denied' | 'timeout' | 'error'; message: string };

export async function getGeolocationPermissionState(): Promise<PermissionState | 'unsupported'> {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
        return 'unsupported';
    }

    if (!('permissions' in navigator) || typeof navigator.permissions?.query !== 'function') {
        return 'unsupported';
    }

    try {
        const result = await navigator.permissions.query({
            name: 'geolocation' as PermissionName,
        });
        return result.state;
    } catch {
        return 'unsupported';
    }
}

/** GPS with structured failure - use for manual city fallback when denied. */
export async function tryDetectDeviceLocation(): Promise<GpsDetectResult> {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
        return { ok: false, reason: 'unsupported', message: 'Geolocation is not supported by your browser.' };
    }

    const permissionState = await getGeolocationPermissionState();
    if (permissionState === 'denied') {
        return {
            ok: false,
            reason: 'denied',
            message: 'Location access is blocked in your browser. Enable location permission for this site, then try again.',
        };
    }

    return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    ok: true,
                    coords: {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    },
                });
            },
            (error) => {
                const denied = error.code === error.PERMISSION_DENIED;
                if (denied) {
                    resolve({
                        ok: false,
                        reason: 'denied',
                        message: 'Location permission denied. Enable location access for this site, or continue by selecting your city and dropping the pin manually.',
                    });
                    return;
                }
                resolve({
                    ok: false,
                    reason: error.code === error.TIMEOUT ? 'timeout' : 'error',
                    message: error.code === error.TIMEOUT
                        ? 'Location lookup timed out. Please try again, or continue by selecting your city and dropping the pin manually.'
                        : 'Unable to detect GPS location. Please try again, or continue by selecting your city and dropping the pin manually.',
                });
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
        );
    });
}

export function getBrowserTimezone(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
        return 'UTC';
    }
}

/** GPS with user-facing alert on failure - use on all location pickers. */
export async function detectLocationForUi(): Promise<GeoCoords | null> {
    const result = await tryDetectDeviceLocation();
    if (!result.ok) {
        if (typeof window !== 'undefined') {
            window.alert(result.message);
        }
        return null;
    }
    return result.coords;
}

export function sortAndDedupeCities(cities: City[]): City[] {
    const seen = new Set<string>();
    const unique: City[] = [];

    for (const city of cities) {
        const key = `${(city.name || '').trim().toLowerCase()}|${(city.country || '').trim().toLowerCase()}`;
        if (!city.name?.trim() || seen.has(key)) continue;
        seen.add(key);
        unique.push(city);
    }

    return unique.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

function normalizeCountryToken(value?: string | null): string {
    return (value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

const COUNTRY_ALIASES: Record<string, string[]> = {
    pakistan: ['pk'],
    india: ['in'],
    'united arab emirates': ['uae', 'ae'],
    'united states': ['us', 'usa', 'united states of america'],
    'united kingdom': ['uk', 'gb', 'great britain'],
    malaysia: ['my'],
};

export function getCanonicalCountryName(country?: string | null): string {
    const normalized = normalizeCountryToken(country);
    if (!normalized) return '';

    for (const [canonical, aliases] of Object.entries(COUNTRY_ALIASES)) {
        if (normalized === canonical || aliases.includes(normalized)) {
            return canonical;
        }
    }

    return normalized;
}

export function sortAndDedupeCountries(
    countries: Array<string | { code?: string; name?: string }>,
): { code: string; name: string }[] {
    const unique = new Map<string, { code: string; name: string }>();

    for (const item of countries) {
        const rawName = typeof item === 'string' ? item : item?.name || item?.code || '';
        const rawCode = typeof item === 'string' ? '' : item?.code || '';
        const canonical = getCanonicalCountryName(rawName || rawCode);
        if (!canonical) continue;

        const displayName = canonical
            .split(' ')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');

        if (!unique.has(canonical)) {
            unique.set(canonical, {
                code: rawCode.trim().toUpperCase(),
                name: displayName,
            });
        } else if (rawCode && !unique.get(canonical)?.code) {
            unique.set(canonical, {
                code: rawCode.trim().toUpperCase(),
                name: unique.get(canonical)?.name || displayName,
            });
        }
    }

    return Array.from(unique.values()).sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    );
}

export function cityMatchesCountry(city: City, selectedCountry?: string | null): boolean {
    const target = getCanonicalCountryName(selectedCountry);
    if (!target) return true;

    const cityCountry = getCanonicalCountryName(city.country);
    return cityCountry === target;
}

export function matchCityInList(cities: City[], nameToMatch: string): City | undefined {
    if (!nameToMatch || !nameToMatch.trim()) return undefined;
    const target = nameToMatch.trim().toLowerCase();

    // 1. Exact match
    let match = cities.find(c => (c.name || '').trim().toLowerCase() === target);
    if (match) return match;

    // 2. Partial match: city in DB includes target or target includes city in DB
    match = cities.find(c => {
        const cName = (c.name || '').trim().toLowerCase();
        return cName.length > 2 && (target.includes(cName) || cName.includes(target));
    });
    if (match) return match;

    return undefined;
}

export function findNearestCity(cities: City[], latitude: number, longitude: number, country?: string): City | null {
    let withCoords = cities.filter(
        (c) => c.latitude != null && c.longitude != null && !isNaN(parseFloat(String(c.latitude))) && !isNaN(parseFloat(String(c.longitude))),
    );
    if (withCoords.length === 0) return null;

    if (country) {
        const countryFiltered = withCoords.filter((c) => cityMatchesCountry(c, country));
        if (countryFiltered.length > 0) {
            withCoords = countryFiltered;
        }
    }

    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371; // Earth radius in km

    return withCoords.reduce<{ city: City | null; distance: number }>(
        (acc, city) => {
            const cLat = parseFloat(String(city.latitude));
            const cLng = parseFloat(String(city.longitude));
            const dLat = toRad(cLat - latitude);
            const dLng = toRad(cLng - longitude);
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(toRad(latitude)) * Math.cos(toRad(cLat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;

            if (!acc.city || distance < acc.distance) return { city, distance };
            return acc;
        },
        { city: null, distance: Number.POSITIVE_INFINITY },
    ).city;
}

export function inferLocationFromCoords(
    cities: City[],
    latitude: number,
    longitude: number,
): { city?: string; state?: string; country?: string } {
    const nearest = findNearestCity(cities, latitude, longitude);
    if (!nearest) return {};

    return {
        city: nearest.name || undefined,
        state: nearest.state || undefined,
        country: nearest.country || undefined,
    };
}

export async function detectNearestCityName(cities: City[]): Promise<string | null> {
    let coords: GeoCoords | null = null;
    let detectedCountry: string | null = null;

    try {
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
            coords = await new Promise<GeoCoords | null>((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
                    (err) => {
                        console.warn('[location-detect] Geolocation failed/denied:', err.message);
                        resolve(null);
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
                );
            });
        }
    } catch {
        // Ignore GPS lookup failure and fall through.
    }

    // If GPS is denied or fails, fallback to IP Geolocation immediately
    if (!coords) {
        try {
            console.log('[location-detect] Falling back to IP Geolocation');
            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client`);
            if (res.ok) {
                const data = await res.json();
                const cityName = data.city || data.locality || data.principalSubdivision;
                if (cityName) {
                    const matched = matchCityInList(cities, cityName);
                    if (matched) return matched.name;
                }
                if (data.countryName) {
                    detectedCountry = data.countryName;
                }
                if (data.latitude && data.longitude) {
                    coords = { latitude: data.latitude, longitude: data.longitude };
                }
            }
        } catch (e) {
            console.warn("[location-detect] IP Geolocation fallback failed:", e);
        }
    }

    if (!coords) return null;

    const lat = coords.latitude;
    const lng = coords.longitude;

    // 1. Try Google Maps Geocoding API if key is available
    const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (googleApiKey) {
        try {
            const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleApiKey}`);
            if (res.ok) {
                const data = await res.json();
                if (data.results && data.results.length > 0) {
                    for (const result of data.results) {
                        for (const comp of result.address_components || []) {
                            if (comp.types.includes('country')) {
                                detectedCountry = comp.long_name;
                            }
                            if (comp.types.includes('locality') || comp.types.includes('administrative_area_level_2') || comp.types.includes('sublocality_level_1')) {
                                const matched = matchCityInList(cities, comp.long_name);
                                if (matched) return matched.name;
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.warn("[location-detect] Google Geocode failed:", e);
        }
    }

    // 2. Try OpenStreetMap Nominatim reverse geocode
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
            headers: { 'Accept-Language': 'en' }
        });
        if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            if (addr.country) detectedCountry = addr.country;
            const cityName = addr.city || addr.town || addr.village || addr.municipality || addr.county || addr.state_district || addr.state;
            if (cityName) {
                const matched = matchCityInList(cities, cityName);
                if (matched) return matched.name;
            }
        }
    } catch (e) {
        console.warn("[location-detect] Nominatim Geocode failed:", e);
    }

    // 3. Try BigDataCloud reverse geocode
    try {
        const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
        if (res.ok) {
            const data = await res.json();
            if (data.countryName) detectedCountry = data.countryName;
            const cityName = data.city || data.locality || data.principalSubdivision;
            if (cityName) {
                const matched = matchCityInList(cities, cityName);
                if (matched) return matched.name;
            }
        }
    } catch (e) {
        console.warn("[location-detect] BigDataCloud Geocode failed:", e);
    }

    // 4. Fallback: calculate spherical Haversine distance for cities that DO have coordinates
    const nearest = findNearestCity(cities, lat, lng, detectedCountry || undefined);
    return nearest?.name || null;
}

export function visibilityDayCount(start?: string, end?: string): number {
    if (!start || !end) return 0;
    const startMs = new Date(start).getTime();
    const endMs = new Date(end).getTime();
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return 0;
    return Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24));
}

export function cleanAndDedupeStates(states: Array<string | { name: string; code?: string }>, countryName?: string | null): string[] {
    const normCountry = (countryName || '').trim().toLowerCase();

    if (normCountry === 'canada' || normCountry === 'ca') {
        return [
            'Alberta',
            'British Columbia',
            'Manitoba',
            'New Brunswick',
            'Newfoundland and Labrador',
            'Northwest Territories',
            'Nova Scotia',
            'Nunavut',
            'Ontario',
            'Prince Edward Island',
            'Quebec',
            'Saskatchewan',
            'Yukon'
        ];
    }
    if (normCountry === 'pakistan' || normCountry === 'pk') {
        return [
            'Azad Jammu and Kashmir',
            'Balochistan',
            'Gilgit-Baltistan',
            'Islamabad Capital Territory',
            'Khyber Pakhtunkhwa',
            'Punjab',
            'Sindh'
        ];
    }
    if (normCountry === 'united states' || normCountry === 'us' || normCountry === 'usa' || normCountry === 'united states of america') {
        return [
            'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
        ];
    }
    if (normCountry === 'australia' || normCountry === 'au') {
        return [
            'Australian Capital Territory',
            'New South Wales',
            'Northern Territory',
            'Queensland',
            'South Australia',
            'Tasmania',
            'Victoria',
            'Western Australia'
        ];
    }
    if (normCountry === 'united kingdom' || normCountry === 'uk' || normCountry === 'gb' || normCountry === 'great britain') {
        return [
            'England',
            'Northern Ireland',
            'Scotland',
            'Wales'
        ];
    }
    if (normCountry === 'united arab emirates' || normCountry === 'uae' || normCountry === 'ae') {
        return [
            'Abu Dhabi',
            'Ajman',
            'Dubai',
            'Fujairah',
            'Ras Al Khaimah',
            'Sharjah',
            'Umm Al Quwain'
        ];
    }
    if (normCountry === 'india' || normCountry === 'in') {
        return [
            'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
        ];
    }

    if (!states || !states.length) return [];

    const rawNames: string[] = [];
    for (const item of states) {
        const name = typeof item === 'string' ? item : item?.name;
        if (name && name.trim()) {
            rawNames.push(name.trim());
        }
    }

    if (rawNames.length === 0) return [];

    const uniqueMap = new Map<string, string>();
    for (const name of rawNames) {
        const clean = name.replace(/\s+(Province|Division|District|Borough|Council|Territory|Region|Governorate|Prefecture)$/i, '').trim();
        const key = clean.toLowerCase();
        if (!uniqueMap.has(key)) {
            uniqueMap.set(key, clean);
        } else if (clean.length < (uniqueMap.get(key)?.length || 999)) {
            uniqueMap.set(key, clean);
        }
    }

    let results = Array.from(uniqueMap.values());
    const nonDivision = results.filter((name) => !/division|district|council|borough/i.test(name));
    if (nonDivision.length > 0) {
        results = nonDivision;
    }

    return results.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}
