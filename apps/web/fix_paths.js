const fs = require('fs');
const path = require('path');

function walk(dir) {
    const results = [];
    const list = fs.readdirSync(dir, { withFileTypes: true });
    list.forEach(file => {
        const filePath = path.join(dir, file.name);
        if (file.isDirectory()) {
            results.push(...walk(filePath));
        } else {
            results.push(filePath);
        }
    });
    return results;
}

// Fix turbopack runtime - change /_next/ to /_assets/
const assetsDir = path.join(__dirname, 'out', '_assets');
const files = walk(assetsDir).filter(f => f.endsWith('.js'));

let fixed = 0;
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;
    
    // Replace the hardcoded /_next/ path in turbopack runtime
    content = content.replace('let t="/_next/"', 'let t="/_assets/"');
    
    if (content !== original) {
        fs.writeFileSync(file, content);
        fixed++;
        console.log('Fixed turbopack runtime in:', path.basename(file));
    }
});

console.log(`\nFixed ${fixed} files with turbopack path`);
