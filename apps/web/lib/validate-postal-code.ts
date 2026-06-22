import postalFormats from './postal_code_formats.json';

interface PostalRule {
  name: string;
  hasPostalCode: boolean;
  regex: string | null;
  stripChars: string;
  example: string | null;
}

interface PostalResult {
  valid: boolean;
  reason: string;
  example?: string | null;
}

const formats = postalFormats as Record<string, PostalRule>;

export function validatePostalCode(countryCode: string, value: string): PostalResult {
  const rule = formats[countryCode?.toUpperCase()];

  if (!rule) {
    return { valid: true, reason: 'unknown_country' };
  }

  if (value == null || String(value).trim() === '') {
    return { valid: true, reason: 'empty_optional' };
  }

  if (!rule.hasPostalCode) {
    return { valid: true, reason: 'country_has_no_postal_code' };
  }

  let v = String(value).trim();
  for (const ch of rule.stripChars) {
    v = v.split(ch).join('');
  }

  if (!rule.regex) {
    return { valid: true, reason: 'no_regex' };
  }

  const ok = new RegExp(rule.regex).test(v);

  return ok
    ? { valid: true, reason: 'match' }
    : { valid: false, reason: 'bad_format', example: rule.example };
}

export function getCountryPostalInfo(countryCode: string): { hasPostalCode: boolean; example: string | null } {
  const rule = formats[countryCode?.toUpperCase()];
  if (!rule) return { hasPostalCode: true, example: null };
  return { hasPostalCode: rule.hasPostalCode, example: rule.example || null };
}
