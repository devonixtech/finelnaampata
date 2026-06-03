import { City } from '../types/api';

export type GeoCoords = { latitude: number; longitude: number };

/** Device GPS only — consistent across all location pickers (no IP fallback). */
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
            (error) => reject(error),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
        );
    });
}

export type GpsDetectResult =
    | { ok: true; coords: GeoCoords }
    | { ok: false; reason: 'unsupported' | 'denied' | 'timeout' | 'error'; message: string };

/** GPS with structured failure — use for manual city fallback when denied. */
export async function tryDetectDeviceLocation(): Promise<GpsDetectResult> {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
        return { ok: false, reason: 'unsupported', message: 'Geolocation is not supported by your browser.' };
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
                resolve({
                    ok: false,
                    reason: denied ? 'denied' : error.code === error.TIMEOUT ? 'timeout' : 'error',
                    message: denied
                        ? 'Location permission denied. Please select your city manually.'
                        : 'Unable to detect GPS location. Please select your city manually.',
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

/** GPS with user-facing alert on failure — use on all location pickers. */
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
        (c) => typeof c.latitude === 'number' && typeof c.longitude === 'number',
    );
    if (withCoords.length === 0) return null;

    return withCoords.reduce<{ city: City | null; score: number }>(
        (acc, city) => {
            const dLat = (city.latitude as number) - latitude;
            const dLng = (city.longitude as number) - longitude;
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
    const coords = await detectDeviceLocation();
    const nearest = findNearestCity(cities, coords.latitude, coords.longitude);
    return nearest?.name || null;
}

export function visibilityDayCount(start?: string, end?: string): number {
    if (!start || !end) return 0;
    const startMs = new Date(start).getTime();
    const endMs = new Date(end).getTime();
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return 0;
    return Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24));
}
