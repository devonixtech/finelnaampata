/** Session token for Google Places billing — one token per autocomplete flow until place is selected. */
export function createPlacesSessionToken(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `sess-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function resetPlacesSessionToken(ref: { current: string }): string {
    ref.current = createPlacesSessionToken();
    return ref.current;
}
