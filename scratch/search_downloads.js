const fs = require('fs');
const path = require('path');

const downloadsPath = 'C:\\Users\\Ahmed Bilal Khan\\Downloads';

if (!fs.existsSync(downloadsPath)) {
    console.log('Downloads folder does not exist');
    process.exit(1);
}

const files = fs.readdirSync(downloadsPath);
console.log(`Found ${files.length} files in Downloads`);

for (const file of files) {
    if (file.endsWith('.json') || file.endsWith('.txt') || file.endsWith('.csv')) {
        const filePath = path.join(downloadsPath, file);
        try {
            const stats = fs.statSync(filePath);
            if (stats.size < 500000) { // < 500KB
                const content = fs.readFileSync(filePath, 'utf8');
                if (content.includes('Business Category Taxonomy') || content.includes('Food & Dining')) {
                    console.log(`FOUND IN FILE: ${file}`);
                    console.log(content.substring(0, 1000));
                }
            }
        } catch (e) {
            // Ignore errors
        }
    }
}
