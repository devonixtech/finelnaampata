import { COUNTRIES_STATES } from './data/countries-states';
const formats = require('./data/postal-code-formats.json');

export function validatePostalCode(countryNameOrCode: string, value?: string): { valid: boolean; reason: string; example?: string } {
  if (!countryNameOrCode) return { valid: true, reason: "unknown_country" };

  let countryCode = countryNameOrCode.trim().toUpperCase();
  if (countryCode.length > 2) {
    // It's a country name, find the 2-letter code
    const found = COUNTRIES_STATES.find(c => c.name.toLowerCase() === countryNameOrCode.trim().toLowerCase());
    if (found && found.code) {
      countryCode = found.code.toUpperCase();
    }
  }

  const rule = formats[countryCode];

  // Unknown country -> don't block the user
  if (!rule) return { valid: true, reason: "unknown_country" };

  // Optional: empty is fine
  if (value == null || String(value).trim() === "") {
    return { valid: true, reason: "empty_optional" };
  }

  // Country has no postal codes (e.g. UAE) -> accept, but you can warn
  if (!rule.hasPostalCode) {
    return { valid: true, reason: "country_has_no_postal_code" };
  }

  // Strip spaces/dashes the format treats as redundant, then test the regex
  let v = String(value).trim();
  for (const ch of rule.stripChars) v = v.split(ch).join("");
  const ok = new RegExp(rule.regex).test(v);

  return ok
    ? { valid: true, reason: "match" }
    : { valid: false, reason: "bad_format", example: rule.example };
}
