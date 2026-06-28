const fs = require('fs');
const path = require('path');

function searchFiles(dir, query) {
    let results = [];
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            if (file === 'node_modules' || file === '.next' || file === 'dist' || file === 'build') continue;
            results = results.concat(searchFiles(fullPath, query));
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.json') || file.endsWith('.html') || file.endsWith('.css')) {
                try {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    if (content.toLowerCase().includes(query.toLowerCase())) {
                        results.push({ path: fullPath, count: (content.toLowerCase().split(query.toLowerCase()).length - 1) });
                    }
                } catch (e) {
                    // skip
                }
            }
        }
    }
    return results;
}

console.log("Matches for 'list business':", searchFiles('apps/web', 'list business'));
console.log("Matches for 'list your':", searchFiles('apps/web', 'list your'));
console.log("Matches for 'business list':", searchFiles('apps/web', 'business list'));
