const fs = require('fs');
const content = fs.readFileSync('apps/web/lib/data/countries-states.ts', 'utf8');
const pakIndex = content.toLowerCase().indexOf('"pakistan"');
console.log("Pakistan index:", pakIndex);
if (pakIndex !== -1) {
    console.log("Surrounding context for Pakistan:\n", content.slice(pakIndex - 100, pakIndex + 1000));
} else {
    // try without quotes
    const pakIndex2 = content.toLowerCase().indexOf('pakistan');
    console.log("Pakistan index (no quotes):", pakIndex2);
    if (pakIndex2 !== -1) {
        console.log("Surrounding context:\n", content.slice(pakIndex2 - 100, pakIndex2 + 1000));
    }
}
