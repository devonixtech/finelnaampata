import { Injectable } from '@nestjs/common';
import { getAddressConfig } from '../../common/utils/address-config.util';
import { ISO_COUNTRIES } from '../../common/data/iso-countries';

type AddressFieldConfig = {
    key: string;
    label: string;
    required: boolean;
};

type CountryAddressConfig = {
    countryCode: string;
    countryName: string;
    fields: AddressFieldConfig[];
    postalCode?: {
        label: string;
        required: boolean;
        regex?: string;
    };
};

@Injectable()
export class AddressConfigService {
    private readonly cache = new Map<string, CountryAddressConfig>();

    getCountries(): { code: string; name: string }[] {
        return [...ISO_COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));
    }
    private readonly countryAliases: Record<string, string> = {
        USA: 'US',
        'UNITED STATES': 'US',
        UK: 'GB',
        'UNITED KINGDOM': 'GB',
        UAE: 'AE',
        'UNITED ARAB EMIRATES': 'AE',
    };

    private normalizeCountryCode(countryCode: string) {
        const code = (countryCode || '').trim().toUpperCase();
        return this.countryAliases[code] || code;
    }

    private toFieldKey(token: string): string {
        const norm = token.toUpperCase();
        if (norm === 'A') return 'address';
        if (norm === 'C') return 'city';
        if (norm === 'S') return 'state';
        if (norm === 'Z') return 'pincode';
        return norm.toLowerCase();
    }

    private toFieldLabel(token: string): string {
        const norm = token.toUpperCase();
        if (norm === 'A') return 'Street Address';
        if (norm === 'C') return 'City';
        if (norm === 'S') return 'State / Province / Region';
        if (norm === 'Z') return 'Postal Code';
        return norm;
    }

    private buildFromLibaddressinput(code: string, data: any): CountryAddressConfig | null {
        if (!data || typeof data !== 'object') return null;

        const fmt = String(data.fmt || '%A%n%C').replace(/%n/g, '\n');
        const requiredSet = new Set(String(data.require || '').split('').map((char: string) => char.toUpperCase()));

        const orderedTokens: string[] = [];
        const seen = new Set<string>();

        for (const match of fmt.matchAll(/%([A-Z])/gi)) {
            const token = String(match[1]).toUpperCase();
            if (!seen.has(token) && token !== 'N') {
                seen.add(token);
                orderedTokens.push(token);
            }
        }

        // Ensure address line 2 always available for all countries
        const fields: AddressFieldConfig[] = orderedTokens
            .filter((token) => token !== 'Z')
            .map((token) => ({
                key: this.toFieldKey(token),
                label: this.toFieldLabel(token),
                required: requiredSet.has(token),
            }));

        if (!fields.some((f) => f.key === 'addressLine2')) {
            const index = Math.min(1, fields.length);
            fields.splice(index, 0, { key: 'addressLine2', label: 'Address Line 2', required: false });
        }

        return {
            countryCode: code,
            countryName: data.name || code,
            fields,
            postalCode: {
                label: data.zip_name_type || 'Postal Code',
                required: false, // Zip Code is always optional
                regex: data.zip ? String(data.zip) : undefined,
            },
        };
    }

    async getConfig(countryCode: string): Promise<CountryAddressConfig> {
        const code = this.normalizeCountryCode(countryCode);
        const cached = this.cache.get(code);
        if (cached) return cached;

        try {
            const url = `https://raw.githubusercontent.com/google/libaddressinput/master/common/src/main/resources/com/google/i18n/addressinput/common/data/${code}`;
            const response = await fetch(url);
            if (response.ok) {
                const json = await response.json();
                const mapped = this.buildFromLibaddressinput(code, json);
                if (mapped) {
                    this.cache.set(code, mapped);
                    return mapped;
                }
            }
        } catch (error) {
            // Fallback below
        }

        const fallback = getAddressConfig(code);
        this.cache.set(code, fallback);
        return fallback;
    }

    async validatePostalCode(countryCode: string, postalCode?: string | null): Promise<boolean> {
        const config = await this.getConfig(countryCode);
        const value = (postalCode || '').trim();

        if (config.postalCode?.required && !value) return false;
        if (!value || !config.postalCode?.regex) return true;

        try {
            return new RegExp(config.postalCode.regex, 'i').test(value);
        } catch {
            return true;
        }
    }
}
