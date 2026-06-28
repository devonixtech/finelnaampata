// validatePostalCode.js
// Optional postal-code validation for an international app.
// Uses postal_code_formats.json (country -> format rules for 248 countries).
//
// Rules:
//   - Empty value is ALWAYS allowed (field is optional).
//   - If the country has no postal-code system, anything (incl. empty) passes.
//   - If a value is entered, it must match that country's format.

const formats = require("./postal_code_formats.json");

function validatePostalCode(countryCode, value) {
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

module.exports = { validatePostalCode };

// --- quick self-test (run: node validatePostalCode.js) ---
if (require.main === module) {
  const tests = [
    ["PK", "54000"],   // valid Pakistan
    ["PK", "5400"],    // too short -> invalid
    ["PK", ""],        // empty -> ok (optional)
    ["US", "90210"],   // valid
    ["US", "90210-1234"], // valid extended
    ["GB", "SW1A 1AA"],// valid UK
    ["AE", "anything"],// UAE has no postcode -> ok
    ["PK", "abcde"],   // letters -> invalid
  ];
  for (const [cc, val] of tests) {
    console.log(cc, JSON.stringify(val), "->", JSON.stringify(validatePostalCode(cc, val)));
  }
}
