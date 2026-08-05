const fs = require('fs');
const path = require('path');
const out = path.join(__dirname, 'out');

// Check turbopack runtime
const tpDir = path.join(out, '_assets');
const tpFile = fs.readdirSync(tpDir).find(f => f.startsWith('turbopack'));
const tp = fs.readFileSync(path.join(tpDir, tpFile), 'utf8');
console.log('Has /_assets/:', tp.includes('let t="/_assets/"'));
console.log('Has /_next/:', tp.includes('let t="/_next/"'));

// Extract otherChunks
const m = tp.match(/otherChunks:\[(.*?)\]/);
if (m) {
    const chunks = m[1].replace(/"/g,'').split(',');
    console.log('otherChunks count:', chunks.length);
    console.log('First 3:', chunks.slice(0,3));
    // Check if files exist
    for (const c of chunks.slice(0,3)) {
        const fp = path.join(out, '_assets', 'static', 'chunks', c);
        console.log(`  ${c}: ${fs.existsSync(fp) ? 'EXISTS' : 'MISSING'}`);
    }
    // Also check flat
    for (const c of chunks.slice(0,3)) {
        const fp = path.join(out, '_assets', c);
        console.log(`  flat ${c}: ${fs.existsSync(fp) ? 'EXISTS' : 'MISSING'}`);
    }
}

// Check HTML
const html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
console.log('\nHTML has /_next/:', html.includes('/_next/'));
console.log('HTML has /_assets/static/chunks/:', html.includes('/_assets/static/chunks/'));
console.log('HTML has /_assets/turbopack:', html.includes('_assets/turbopack'));

// Check no recursion
const innerStatic = path.join(out, '_assets', 'static', 'chunks', 'static');
console.log('\nRecursion check:', fs.existsSync(innerStatic) ? 'BROKEN' : 'OK');

// Count files
const scCount = fs.readdirSync(path.join(out, '_assets', 'static', 'chunks')).length;
const flatCount = fs.readdirSync(path.join(out, '_assets')).filter(f => fs.statSync(path.join(out, '_assets', f)).isFile()).length;
console.log('_assets/static/chunks/ files:', scCount);
console.log('_assets/ flat files:', flatCount);
