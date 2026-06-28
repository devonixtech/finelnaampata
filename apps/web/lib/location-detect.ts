import { City } from '../types/api';

export type GeoCoords = { latitude: number; longitude: number };
export type IpGeoData = { latitude: number; longitude: number; city?: string; region?: string; country_name?: string };

/**
 * IP-based fallback location detection.
 * Returns coordinates AND city/country name strings from the IP API response.
 */
async function detectLocationByIp(): Promise<GeoCoords> {
    const data = await fetchIpGeoData();
    return { latitude: data.latitude, longitude: data.longitude };
}

/**
 * Fetches full IP geolocation data including city and country name.
 */
async function fetchIpGeoData(): Promise<IpGeoData> {
    const response = await fetch('https://ipapi.co/json/');
    if (!response.ok) {
        throw new Error('IP geolocation lookup failed');
    }
    const data = await response.json();
    if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        return {
            latitude: data.latitude,
            longitude: data.longitude,
            city: data.city,
            region: data.region,
            country_name: data.country_name,
        };
    }
    throw new Error('IP geolocation returned no coordinates');
}

/** Device GPS with IP fallback - consistent across all location pickers. */
export function detectDeviceLocation(): Promise<GeoCoords> {
    return new Promise((resolve, reject) => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            // Fall back to IP
            detectLocationByIp().then(resolve).catch(() => reject(new Error('Geolocation is not supported by your browser')));
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
                // GPS failed, try IP fallback
                detectLocationByIp().then(resolve).catch(() => reject(new Error('Unable to detect location')));
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
                        message: 'Location permission denied. Enable location access for this site and try again.',
                    });
                    return;
                }
                // For timeout or other GPS errors, try IP fallback
                detectLocationByIp()
                    .then((coords) => resolve({ ok: true, coords }))
                    .catch(() => resolve({
                        ok: false,
                        reason: error.code === error.TIMEOUT ? 'timeout' : 'error',
                        message: error.code === error.TIMEOUT
                            ? 'Location lookup timed out. Please try again or select your city manually.'
                            : 'Unable to detect GPS location. Please try again or select your city manually.',
                    }));
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

export function findNearestCity(cities: City[], latitude: number, longitude: number): City | null {
    const withCoords = cities.filter(
        (c) => c.latitude != null && c.longitude != null && !isNaN(parseFloat(String(c.latitude))) && !isNaN(parseFloat(String(c.longitude))),
    );
    if (withCoords.length === 0) return null;

    return withCoords.reduce<{ city: City | null; score: number }>(
        (acc, city) => {
            const dLat = parseFloat(String(city.latitude)) - latitude;
            const dLng = parseFloat(String(city.longitude)) - longitude;
            const score = dLat * dLat + dLng * dLng;
            if (!acc.city || score < acc.score) return { city, score };
            return acc;
        },
        { city: null, score: Number.POSITIVE_INFINITY },
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
    let ipCity: string | undefined;
    let ipRegion: string | undefined;

    try {
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
            coords = await new Promise<GeoCoords | null>((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
                    () => resolve(null),
                    { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
                );
            });
        }

        // Always fetch IP geo data as a robust fallback for city name matching
        const ipData = await fetchIpGeoData();
        if (!coords) {
            coords = { latitude: ipData.latitude, longitude: ipData.longitude };
        }
        ipCity = ipData.city;
        ipRegion = ipData.region;
    } catch {
        // Fallback if IP fetch fails
    }

    if (coords) {
        // Step 1: Try coordinate-based matching
        const nearest = findNearestCity(cities, coords.latitude, coords.longitude);
        if (nearest) return nearest.name;
    }

    // Step 2: Fallback — match by IP city/region name against our city list
    const candidates = [ipCity, ipRegion].filter(Boolean) as string[];
    for (const candidate of candidates) {
        const normalized = candidate.trim().toLowerCase();
        const match = cities.find(
            (c) => c.name?.trim().toLowerCase() === normalized ||
                   c.name?.trim().toLowerCase().includes(normalized) ||
                   normalized.includes(c.name?.trim().toLowerCase() || '')
        );
        if (match) return match.name;
    }

    // Step 3: Direct fallback - if IP detected a valid city name, use it directly rather than failing
    if (ipCity && ipCity.trim()) {
        return ipCity.trim();
    }
    if (ipRegion && ipRegion.trim()) {
        return ipRegion.trim();
    }

    return null;
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
        } else {
            if (clean.length < (uniqueMap.get(key)?.length || 999)) {
                uniqueMap.set(key, clean);
            }
        }
    }

    let results = Array.from(uniqueMap.values());
    const nonDivision = results.filter(n => !/division|district|council|borough/i.test(n));
    if (nonDivision.length > 0) {
        results = nonDivision;
    }

    return results.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

