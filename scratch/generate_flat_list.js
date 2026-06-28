const fs = require('fs');
const path = require('path');

const taxonomy = JSON.parse(fs.readFileSync('business_categories.json', 'utf8'));

const names = new Set();
const slugs = new Set();
const flatList = [];

function addCategory(name, slug, parentName, parentSlug) {
    let finalName = name.trim();
    let finalSlug = slug.trim().toLowerCase();

    // Handle name duplicates
    if (names.has(finalName.toLowerCase())) {
        if (parentName) {
            finalName = `${finalName} (${parentName})`;
        }
        let counter = 1;
        let tempName = finalName;
        while (names.has(tempName.toLowerCase())) {
            tempName = `${finalName} ${counter++}`;
        }
        finalName = tempName;
    }
    names.add(finalName.toLowerCase());

    // Handle slug duplicates
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

// Convert
for (const cat of taxonomy.categories) {
    const main = addCategory(cat.name, cat.slug, null, null);
    flatList.push({
        name: main.name,
        slug: main.slug,
        icon: cat.icon || null,
        parentName: null,
        source: 'admin',
        status: 'active'
    });
    
    if (cat.subcategories) {
        for (const sub of cat.subcategories) {
            const s = addCategory(sub.name, sub.slug, main.name, main.slug);
            flatList.push({
                name: s.name,
                slug: s.slug,
                parentName: main.name,
                source: 'admin',
                status: 'active'
            });
            
            if (sub.business_types) {
                for (const bt of sub.business_types) {
                    const b = addCategory(bt.name, bt.slug, s.name, s.slug);
                    flatList.push({
                        name: b.name,
                        slug: b.slug,
                        parentName: s.name,
                        source: 'admin',
                        status: 'active'
                    });
                }
            }
        }
    }
}

fs.writeFileSync('categories-list.json', JSON.stringify(flatList, null, 2));
console.log('categories-list.json updated. Total categories:', flatList.length);
