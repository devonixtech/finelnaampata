export function isValidGlobalPhone(value?: string | null): boolean {
    if (!value) return false;

    const normalized = value.replace(/[^\d+]/g, '');
    // Global standard: + followed by 8 to 15 digits (including country code)
    if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
        return false;
    }

    return true;
}

export function normalizeGlobalPhone(value?: string | null): string | null {
    if (!value) return null;
    return value.replace(/[^\d+]/g, '');
}
