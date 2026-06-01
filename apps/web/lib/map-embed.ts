/** Doc-compliant map display: Google Maps embed (no Maps JavaScript API). */
export function getGoogleMapEmbedUrl(business: {
    latitude?: number | string | null;
    longitude?: number | string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
}): string | null {
    const lat = parseFloat(String(business.latitude ?? ''));
    const lng = parseFloat(String(business.longitude ?? ''));
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return `https://www.google.com/maps?q=${lat},${lng}&output=embed`;
    }
    const query = [business.address, business.city, business.state].filter(Boolean).join(', ').trim();
    if (!query) return null;
    return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}
