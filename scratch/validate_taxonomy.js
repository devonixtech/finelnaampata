const fs = require('fs');
const path = require('path');

const taxonomyPath = path.join(__dirname, '../business_categories.json');
const taxonomy = JSON.parse(fs.readFileSync(taxonomyPath, 'utf8'));

const names = new Set();
const slugs = new Set();
const duplicateNames = [];
const duplicateSlugs = [];

function check(name, slug, pathInfo) {
    const normName = name.toLowerCase().trim();
    const normSlug = slug.toLowerCase().trim();

    if (names.has(normName)) {
        duplicateNames.push({ name, path: pathInfo });
    } else {
        names.add(normName);
    }

    if (slugs.has(normSlug)) {
        duplicateSlugs.push({ slug, path: pathInfo });
    } else {
        slugs.add(normSlug);
    }
}

for (const cat of taxonomy.categories) {
    check(cat.name, cat.slug, cat.name);
    if (cat.subcategories) {
        for (const sub of cat.subcategories) {
            check(sub.name, sub.slug, `${cat.name} -> ${sub.name}`);
            if (sub.business_types) {
                for (const bt of sub.business_types) {
                    check(bt.name, bt.slug, `${cat.name} -> ${sub.name} -> ${bt.name}`);
                }
            }
        }
    }
}

console.log('Total unique names:', names.size);
console.log('Total unique slugs:', slugs.size);
console.log('Duplicate names count:', duplicateNames.length);
console.log('Duplicate slugs count:', duplicateSlugs.length);

if (duplicateNames.length > 0) {
    console.log('Duplicate Names:', duplicateNames.slice(0, 10));
}
if (duplicateSlugs.length > 0) {
    console.log('Duplicate Slugs:', duplicateSlugs.slice(0, 10));
}
