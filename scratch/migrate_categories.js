const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const connStr = "postgresql://postgres:RvkwtnMaGpHpXnkqniMeDvRBOKAxihdI@shuttle.proxy.rlwy.net:45505/railway";

async function run() {
    const client = new Client({
        connectionString: connStr,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to database.');

        // 1. Load the new taxonomy JSON
        const taxonomyPath = path.join(__dirname, '../business_categories.json');
        if (!fs.existsSync(taxonomyPath)) {
            throw new Error('business_categories.json not found in workspace root!');
        }
        const taxonomy = JSON.parse(fs.readFileSync(taxonomyPath, 'utf8'));
        console.log('Loaded new taxonomy JSON.');

        // 2. Fetch existing businesses, job leads and categories for mapping and backup
        const oldCatsRes = await client.query("SELECT * FROM categories");
        const oldCats = oldCatsRes.rows;
        console.log(`Backup: Found ${oldCats.length} categories currently in DB.`);

        const oldBusinessesRes = await client.query("SELECT id, name, category_id FROM businesses");
        const oldBusinesses = oldBusinessesRes.rows;
        console.log(`Backup: Found ${oldBusinesses.length} businesses currently in DB.`);

        const oldLeadsRes = await client.query("SELECT id, title, category_id FROM job_leads");
        const oldLeads = oldLeadsRes.rows;
        console.log(`Backup: Found ${oldLeads.length} job leads currently in DB.`);

        const oldSubcatsRes = await client.query("SELECT * FROM business_subcategories");
        const oldSubcats = oldSubcatsRes.rows;
        console.log(`Backup: Found ${oldSubcats.length} subcategories associations in DB.`);

        // Backup to local file just in case
        fs.writeFileSync(
            path.join(__dirname, 'backup_before_migration.json'),
            JSON.stringify({ oldCats, oldBusinesses, oldLeads, oldSubcats }, null, 2)
        );
        console.log('Backup written to backup_before_migration.json');

        // Create a map of old category ID -> name
        const oldCatIdToName = {};
        for (const cat of oldCats) {
            oldCatIdToName[cat.id] = cat.name;
        }

        // 3. Start Transaction
        await client.query("BEGIN");
        console.log('Transaction started.');

        // 4. Create a temp category
        const tempCatId = uuidv4();
        await client.query(
            `INSERT INTO categories (id, name, slug, description, status, source) 
             VALUES ($1, $2, $3, $4, 'active', 'admin')`,
            [tempCatId, 'Temp Migration Category', 'temp-migration-category', 'Temporary category during migration']
        );
        console.log('Temp category created.');

        // 5. Point all businesses and job leads to the temp category
        await client.query("UPDATE businesses SET category_id = $1", [tempCatId]);
        await client.query("UPDATE job_leads SET category_id = $1", [tempCatId]);
        console.log('All businesses and job leads pointed to temp category.');

        // 6. Delete all business_subcategories
        await client.query("DELETE FROM business_subcategories");
        console.log('Cleared business_subcategories table.');

        // 7. Delete all old categories (except the temp one)
        await client.query("DELETE FROM categories WHERE id != $1", [tempCatId]);
        console.log('All old categories deleted.');

        // 8. Process and insert the new taxonomy
        const names = new Set();
        const slugs = new Set();

        function getUniqueNameAndSlug(name, slug, parentName, parentSlug) {
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

        const newCatsMap = new Map(); // original path/name -> new DB row

        // Insert Level 1: Main Categories
        for (const cat of taxonomy.categories) {
            const id = uuidv4();
            const { name, slug } = getUniqueNameAndSlug(cat.name, cat.slug, null, null);
            const icon = cat.icon || null;
            
            await client.query(
                `INSERT INTO categories (id, name, slug, icon, parent_id, status, source) 
                 VALUES ($1, $2, $3, $4, NULL, 'active', 'admin')`,
                [id, name, slug, icon]
            );
            newCatsMap.set(cat.name.toLowerCase(), { id, name, slug });

            // Insert Level 2: Subcategories
            if (cat.subcategories) {
                for (const sub of cat.subcategories) {
                    const subId = uuidv4();
                    const subUnique = getUniqueNameAndSlug(sub.name, sub.slug, cat.name, cat.slug);
                    
                    await client.query(
                        `INSERT INTO categories (id, name, slug, parent_id, status, source) 
                         VALUES ($1, $2, $3, $4, 'active', 'admin')`,
                        [subId, subUnique.name, subUnique.slug, id]
                    );
                    newCatsMap.set(sub.name.toLowerCase(), { id: subId, name: subUnique.name, slug: subUnique.slug });

                    // Insert Level 3: Business Types
                    if (sub.business_types) {
                        for (const bt of sub.business_types) {
                            const btId = uuidv4();
                            const btUnique = getUniqueNameAndSlug(bt.name, bt.slug, sub.name, sub.slug);
                            
                            await client.query(
                                `INSERT INTO categories (id, name, slug, parent_id, status, source) 
                                 VALUES ($1, $2, $3, $4, 'active', 'admin')`,
                                [btId, btUnique.name, btUnique.slug, subId]
                            );
                            newCatsMap.set(bt.name.toLowerCase(), { id: btId, name: btUnique.name, slug: btUnique.slug });
                        }
                    }
                }
            }
        }
        console.log(`Inserted ${names.size} new categories in the taxonomy hierarchy.`);

        // Find a fallback category among the new ones
        // We'll search for "Other Services" or just pick the first main category
        let fallbackCatId = null;
        for (const [key, value] of newCatsMap.entries()) {
            if (key.includes('other services') || key.includes('miscellaneous')) {
                fallbackCatId = value.id;
                break;
            }
        }
        if (!fallbackCatId) {
            // Default to the first main category
            fallbackCatId = newCatsMap.get(taxonomy.categories[0].name.toLowerCase()).id;
        }
        console.log('Fallback category ID chosen:', fallbackCatId);

        // 9. Map businesses back to the new categories
        let matchedCount = 0;
        let fallbackCount = 0;

        for (const biz of oldBusinesses) {
            const oldCatName = oldCatIdToName[biz.category_id];
            if (!oldCatName) {
                console.log(`Business "${biz.name}" had no old category name. Setting to fallback.`);
                await client.query("UPDATE businesses SET category_id = $1 WHERE id = $2", [fallbackCatId, biz.id]);
                fallbackCount++;
                continue;
            }

            // Look for matching category in new cats map
            const match = newCatsMap.get(oldCatName.toLowerCase());
            if (match) {
                await client.query("UPDATE businesses SET category_id = $1 WHERE id = $2", [match.id, biz.id]);
                matchedCount++;
            } else {
                // Try fuzzy/partial matching or fallback
                let fuzzyMatch = null;
                for (const [key, val] of newCatsMap.entries()) {
                    if (key.includes(oldCatName.toLowerCase()) || oldCatName.toLowerCase().includes(key)) {
                        fuzzyMatch = val;
                        break;
                    }
                }

                if (fuzzyMatch) {
                    await client.query("UPDATE businesses SET category_id = $1 WHERE id = $2", [fuzzyMatch.id, biz.id]);
                    matchedCount++;
                } else {
                    await client.query("UPDATE businesses SET category_id = $1 WHERE id = $2", [fallbackCatId, biz.id]);
                    fallbackCount++;
                }
            }
        }
        console.log(`Remapped businesses: ${matchedCount} matched, ${fallbackCount} set to fallback.`);

        // 10. Map job leads back to the new categories
        let leadsMatchedCount = 0;
        let leadsFallbackCount = 0;

        for (const lead of oldLeads) {
            const oldCatName = oldCatIdToName[lead.category_id];
            if (!oldCatName) {
                await client.query("UPDATE job_leads SET category_id = $1 WHERE id = $2", [fallbackCatId, lead.id]);
                leadsFallbackCount++;
                continue;
            }

            const match = newCatsMap.get(oldCatName.toLowerCase());
            if (match) {
                await client.query("UPDATE job_leads SET category_id = $1 WHERE id = $2", [match.id, lead.id]);
                leadsMatchedCount++;
            } else {
                let fuzzyMatch = null;
                for (const [key, val] of newCatsMap.entries()) {
                    if (key.includes(oldCatName.toLowerCase()) || oldCatName.toLowerCase().includes(key)) {
                        fuzzyMatch = val;
                        break;
                    }
                }

                if (fuzzyMatch) {
                    await client.query("UPDATE job_leads SET category_id = $1 WHERE id = $2", [fuzzyMatch.id, lead.id]);
                    leadsMatchedCount++;
                } else {
                    await client.query("UPDATE job_leads SET category_id = $1 WHERE id = $2", [fallbackCatId, lead.id]);
                    leadsFallbackCount++;
                }
            }
        }
        console.log(`Remapped job leads: ${leadsMatchedCount} matched, ${leadsFallbackCount} set to fallback.`);

        // 11. Delete the temp category
        await client.query("DELETE FROM categories WHERE id = $1", [tempCatId]);
        console.log('Temp category deleted.');

        // Commit transaction
        await client.query("COMMIT");
        console.log('Transaction COMMITTED successfully!');

    } catch (e) {
        console.error('Migration error. Performing rollback:', e);
        try {
            await client.query("ROLLBACK");
            console.log('Rollback completed.');
        } catch (rollbackErr) {
            console.error('Rollback failed:', rollbackErr);
        }
    } finally {
        await client.end();
        console.log('Database connection closed.');
    }
}

run();
