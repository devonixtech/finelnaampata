const fs = require('fs');
const path = require('path');

const taxonomyPath = path.join(__dirname, '../business_categories.json');
const taxonomy = JSON.parse(fs.readFileSync(taxonomyPath, 'utf8'));

const names = new Set();
const slugs = new Set();
const finalCategories = [];

function addCategory(name, slug, parentName, parentSlug) {
    let finalName = name.trim();
    let finalSlug = slug.trim().toLowerCase();

    // If duplicate name, append parent name
    if (names.has(finalName.toLowerCase())) {
        if (parentName) {
            finalName = `${finalName} (${parentName})`;
        }
        // If still duplicate, add counter
        let counter = 1;
        let tempName = finalName;
        while (names.has(tempName.toLowerCase())) {
            tempName = `${finalName} ${counter++}`;
        }
        finalName = tempName;
    }
    names.add(finalName.toLowerCase());

    // If duplicate slug, append parent slug
    if (slugs.has(finalSlug)) {
        if (parentSlug) {
            finalSlug = `${finalSlug}-${parentSlug}`;
        }
        let counter = 1;
        let tempSlug = finalSlug;
        while (slugs.has(tempSlug)) {
            tempSlug = `${finalSlug}-${counter++}`;
        }
        finalSlug = tempSlug;
    }
    slugs.add(finalSlug);

    return { name: finalName, slug: finalSlug };
}

for (const cat of taxonomy.categories) {
    const main = addCategory(cat.name, cat.slug, null, null);
    finalCategories.push({ name: main.name, slug: main.slug, level: 1 });
    
    if (cat.subcategories) {
        for (const sub of cat.subcategories) {
            const s = addCategory(sub.name, sub.slug, cat.name, cat.slug);
            finalCategories.push({ name: s.name, slug: s.slug, level: 2 });
            
            if (sub.business_types) {
                for (const bt of sub.business_types) {
                    const b = addCategory(bt.name, bt.slug, sub.name, sub.slug);
                    finalCategories.push({ name: b.name, slug: b.slug, level: 3 });
                }
            }
        }
    }
}

console.log('Processed categories count:', finalCategories.length);
console.log('Total unique names:', names.size);
console.log('Total unique slugs:', slugs.size);
console.log('Renamed duplicates:');
for (const cat of finalCategories) {
    // Check if name is original or has parenthesis
    if (cat.name.includes('(')) {
        console.log(`Renamed: "${cat.name}" -> slug: "${cat.slug}"`);
    }
}
