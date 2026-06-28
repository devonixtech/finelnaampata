const fs = require('fs');
const path = require('path');

function searchFiles(dir, query) {
    let results = [];
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            if (['node_modules', '.next', 'dist', 'build', 'out', '.git'].includes(file)) continue;
            results = results.concat(searchFiles(fullPath, query));
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.json') || file.endsWith('.html') || file.endsWith('.css') || file.endsWith('.md')) {
                try {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    const idx = content.toLowerCase().indexOf(query.toLowerCase());
                    if (idx !== -1) {
                        const lines = content.slice(0, idx).split('\n');
                        const lineNum = lines.length;
                        const lineContent = content.split('\n')[lineNum - 1];
                        results.push({ path: fullPath, line: lineNum, text: lineContent.trim() });
                    }
                } catch (e) {
                    // skip
                }
            }
        }
    }
    return results;
}

const queries = ['list my business', 'list your business', 'list business'];
queries.forEach(q => {
    console.log(`=== Matches for "${q}": ===`);
    const matches = searchFiles('.', q);
    matches.forEach(m => console.log(`${m.path}:${m.line} -> ${m.text}`));
});
