export type DialCodeOption = { country: string; code: string; dialCode: string };

/** Remove duplicate dial codes / country codes for phone dropdowns. */
export function dedupeDialCodes(options: DialCodeOption[]): DialCodeOption[] {
    const byCode = new Map<string, DialCodeOption>();
    for (const opt of options) {
        const iso = (opt.code || '').trim().toUpperCase();
        if (!iso || byCode.has(iso)) continue;
        byCode.set(iso, opt);
    }
    return Array.from(byCode.values()).sort((a, b) => a.country.localeCompare(b.country));
}

export const DEFAULT_DIAL_CODES: DialCodeOption[] = dedupeDialCodes([
    { country: 'Pakistan', code: 'PK', dialCode: '+92' },
    { country: 'India', code: 'IN', dialCode: '+91' },
    { country: 'United Arab Emirates', code: 'AE', dialCode: '+971' },
    { country: 'Saudi Arabia', code: 'SA', dialCode: '+966' },
    { country: 'United States', code: 'US', dialCode: '+1' },
    { country: 'United Kingdom', code: 'GB', dialCode: '+44' },
    { country: 'Canada', code: 'CA', dialCode: '+1' },
    { country: 'Australia', code: 'AU', dialCode: '+61' },
    { country: 'Malaysia', code: 'MY', dialCode: '+60' },
]);
