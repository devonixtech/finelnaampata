import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

export interface AddressFieldConfig {
  used: boolean;
  required: boolean;
  label: string;
  order?: number;
  key?: string;
  options?: { code: string; name: string }[];
  regex?: string | null;
}

export interface CountryAddressConfig {
  countryCode?: string;
  countryName?: string;
  fieldOrder?: string[];
  fields?: AddressFieldConfig[];
  addressLines: AddressFieldConfig;
  locality: AddressFieldConfig;
  administrativeArea: AddressFieldConfig;
  postalCode: AddressFieldConfig;
}

export interface Country {
  code: string;
  name: string;
}

const DEFAULT_CONFIG: CountryAddressConfig = {
  addressLines: { used: true, required: true, label: 'Street Address' },
  locality: { used: true, required: true, label: 'City' },
  administrativeArea: { used: true, required: false, label: 'State / Province', options: [] },
  postalCode: { used: true, required: false, label: 'Postal Code' },
};

const cache = new Map<string, CountryAddressConfig>();
let countriesCache: Country[] | null = null;

export function useAddressConfig(countryCode: string | null) {
  const [config, setConfig] = useState<CountryAddressConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!countryCode) {
      setConfig(DEFAULT_CONFIG);
      return;
    }

    const cacheKey = countryCode.toUpperCase();
    if (cache.has(cacheKey)) {
      setConfig(cache.get(cacheKey)!);
      return;
    }

    setLoading(true);
    api.addressConfig.get(cacheKey)
      .then(data => {
        cache.set(cacheKey, data);
        setConfig(data);
      })
      .catch(() => {
        // Silently fall back to defaults
        setConfig(DEFAULT_CONFIG);
      })
      .finally(() => setLoading(false));
  }, [countryCode]);

  const validatePostalCode = useCallback((postalCode: string): boolean => {
    if (!postalCode) return !config.postalCode.required;
    const regex = config.postalCode.regex;
    if (!regex) return true;
    try {
      return new RegExp(`^(${regex})$`, 'i').test(postalCode);
    } catch {
      return true;
    }
  }, [config]);

  return { config, loading, validatePostalCode };
}

export async function fetchCountries(): Promise<Country[]> {
  if (countriesCache) return countriesCache;
  try {
    const data = await api.addressConfig.getCountries();
    countriesCache = data;
    return data;
  } catch {
    return [];
  }
}
