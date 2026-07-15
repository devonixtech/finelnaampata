const fs = require('fs');

fetch('https://raw.githubusercontent.com/mledoze/countries/master/countries.json').then(r=>r.json()).then(data => { 
    const codes = data.map(d => { 
        const root = d.idd.root || ''; 
        const suffixes = d.idd.suffixes || []; 
        const code = suffixes.length === 1 ? root + suffixes[0] : root; 
        return { country: d.name.common, code: d.cca2, dialCode: code }; 
    }).filter(c => c.dialCode && !c.dialCode.includes('undefined')); 
    
    const content = `export type DialCodeOption = { country: string; code: string; dialCode: string };

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

export const DEFAULT_DIAL_CODES: DialCodeOption[] = dedupeDialCodes(${JSON.stringify(codes, null, 4)});
`; 
    fs.writeFileSync('apps/web/lib/phone-codes.ts', content); 
    console.log('Successfully wrote phone-codes.ts with ' + codes.length + ' entries.');
});
