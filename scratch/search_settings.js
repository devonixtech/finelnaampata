const fs = require('fs');
const content = fs.readFileSync('apps/web/app/(dashboard)/settings/page.tsx', 'utf8');

// Find the section that renders country dropdown or input in settings/page.tsx
const countryRenderIdx = content.indexOf('name="country"');
console.log("Country render index:", countryRenderIdx);
if (countryRenderIdx !== -1) {
    console.log("Country render section:\n", content.slice(countryRenderIdx - 200, countryRenderIdx + 1200));
}

const stateRenderIdx = content.indexOf('name="state"');
console.log("State render index:", stateRenderIdx);
if (stateRenderIdx !== -1) {
    console.log("State render section:\n", content.slice(stateRenderIdx - 200, stateRenderIdx + 1200));
}
