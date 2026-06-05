import { Injectable } from '@nestjs/common';
import {
    CountryAddressConfig,
    buildCountryAddressConfigFromLibAddressInput,
    getAddressConfig,
    getSupportedAddressConfigs,
    LibAddressInputRecord,
    resolveCountryCode,
} from '../../common/utils/address-config.util';
import { ISO_COUNTRIES } from '../../common/data/iso-countries';

@Injectable()
export class AddressConfigService {
    private readonly cache = new Map<string, CountryAddressConfig>();
    private readonly remoteBaseUrl = 'https://chromium-i18n.appspot.com/ssl-address/data';

    getCountries(): { code: string; name: string }[] {
        return [...ISO_COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));
    }

    getSupportedConfigs(): CountryAddressConfig[] {
        return getSupportedAddressConfigs();
    }

    async getConfig(countryCode: string): Promise<CountryAddressConfig> {
        const code = resolveCountryCode(countryCode);
        const cached = this.cache.get(code);
        if (cached) return cached;

        const countryName = this.getCountries().find((entry) => entry.code === code)?.name || code || 'Unknown';
        const remote = await this.fetchLibAddressInputRecord(code);
        const config = remote
            ? buildCountryAddressConfigFromLibAddressInput(code, countryName, remote)
            : getAddressConfig(code);

        this.cache.set(code, config);
        return config;
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

    private async fetchLibAddressInputRecord(countryCode: string): Promise<LibAddressInputRecord | null> {
        if (!countryCode) return null;

        try {
            const response = await fetch(`${this.remoteBaseUrl}/${encodeURIComponent(countryCode)}`, {
                headers: { Accept: 'application/json' },
            });
            if (!response.ok) return null;
            return (await response.json()) as LibAddressInputRecord;
        } catch {
            return null;
        }
    }
}
