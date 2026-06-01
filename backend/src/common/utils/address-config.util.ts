export type AddressFieldConfig = {
    key: string;
    label: string;
    required: boolean;
};

export type CountryAddressConfig = {
    countryCode: string;
    countryName: string;
    fields: AddressFieldConfig[];
    postalCode?: {
        label: string;
        required: boolean;
        regex?: string;
    };
};

const ADDRESS_CONFIGS: Record<string, CountryAddressConfig> = {
    US: {
        countryCode: 'US',
        countryName: 'United States',
        fields: [
            { key: 'address', label: 'Street Address', required: true },
            { key: 'addressLine2', label: 'Address Line 2', required: false },
            { key: 'city', label: 'City', required: true },
            { key: 'state', label: 'State', required: true },
        ],
        postalCode: { label: 'ZIP Code', required: false, regex: '^\\d{5}(-\\d{4})?$' },
    },
    CA: {
        countryCode: 'CA',
        countryName: 'Canada',
        fields: [
            { key: 'address', label: 'Street Address', required: true },
            { key: 'addressLine2', label: 'Address Line 2', required: false },
            { key: 'city', label: 'City', required: true },
            { key: 'state', label: 'Province', required: true },
        ],
        postalCode: { label: 'Postal Code', required: false, regex: '^[A-Za-z]\\d[A-Za-z][ -]?\\d[A-Za-z]\\d$' },
    },
    GB: {
        countryCode: 'GB',
        countryName: 'United Kingdom',
        fields: [
            { key: 'address', label: 'Address Line 1', required: true },
            { key: 'addressLine2', label: 'Address Line 2', required: false },
            { key: 'city', label: 'Post Town', required: true },
            { key: 'state', label: 'County', required: false },
        ],
        postalCode: { label: 'Postcode', required: false, regex: '^[A-Z]{1,2}\\d[A-Z\\d]?\\s?\\d[A-Z]{2}$' },
    },
    AE: {
        countryCode: 'AE',
        countryName: 'United Arab Emirates',
        fields: [
            { key: 'address', label: 'Street Address', required: true },
            { key: 'addressLine2', label: 'Building / Unit', required: false },
            { key: 'city', label: 'City', required: true },
            { key: 'state', label: 'Emirate', required: true },
        ],
        postalCode: { label: 'Postal Code', required: false },
    },
    PK: {
        countryCode: 'PK',
        countryName: 'Pakistan',
        fields: [
            { key: 'address', label: 'Street Address', required: true },
            { key: 'addressLine2', label: 'Address Line 2', required: false },
            { key: 'city', label: 'City', required: true },
            { key: 'state', label: 'Province', required: true },
        ],
        postalCode: { label: 'Postal Code', required: false, regex: '^\\d{5}$' },
    },
};

const COUNTRY_ALIASES: Record<string, string> = {
    USA: 'US',
    'United States': 'US',
    Canada: 'CA',
    UK: 'GB',
    'United Kingdom': 'GB',
    UAE: 'AE',
    'United Arab Emirates': 'AE',
    Pakistan: 'PK',
};

export function resolveCountryCode(country?: string | null): string {
    if (!country) return '';
    const trimmed = country.trim();
    const upper = trimmed.toUpperCase();
    return ADDRESS_CONFIGS[upper] ? upper : COUNTRY_ALIASES[trimmed] || COUNTRY_ALIASES[upper] || upper;
}

export function getAddressConfig(country?: string | null): CountryAddressConfig {
    const code = resolveCountryCode(country);
    return ADDRESS_CONFIGS[code] || {
        countryCode: code,
        countryName: country || code,
        fields: [
            { key: 'address', label: 'Street Address', required: true },
            { key: 'addressLine2', label: 'Address Line 2', required: false },
            { key: 'city', label: 'City / Locality', required: true },
            { key: 'state', label: 'State / Province / Region', required: false },
        ],
        postalCode: { label: 'Postal Code', required: false },
    };
}

export function validatePostalCode(country: string | undefined, postalCode?: string | null): boolean {
    const config = getAddressConfig(country);
    const value = (postalCode || '').trim();

    if (config.postalCode?.required && !value) return false;
    if (!value || !config.postalCode?.regex) return true;

    return new RegExp(config.postalCode.regex, 'i').test(value);
}
