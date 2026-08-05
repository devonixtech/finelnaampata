const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUT = path.join(__dirname, 'out');
const ASSETS = path.join(OUT, '_assets');
const SRC_CHUNKS = path.join(__dirname, '.next', 'static', 'chunks');
const SRC_CSS = path.join(__dirname, '.next', 'static', 'css');

function copyFlat(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    let count = 0;
    for (const item of fs.readdirSync(src, { withFileTypes: true })) {
        if (!item.isDirectory()) {
            fs.copyFileSync(path.join(src, item.name), path.join(dest, item.name));
            count++;
        }
    }
    return count;
}

function copyRecursive(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    let count = 0;
    for (const item of fs.readdirSync(src, { withFileTypes: true })) {
        const s = path.join(src, item.name);
        const d = path.join(dest, item.name);
        if (item.isDirectory()) {
            count += copyRecursive(s, d);
        } else {
            fs.copyFileSync(s, d);
            count++;
        }
    }
    return count;
}

console.log('=== Step 1: Copy chunks from .next to _assets/ (flat) ===');
if (fs.existsSync(SRC_CHUNKS)) {
    const n = copyFlat(SRC_CHUNKS, ASSETS);
    console.log(`  Copied ${n} files to _assets/`);
}

console.log('\n=== Step 2: Copy chunks from .next to _assets/static/chunks/ ===');
if (fs.existsSync(SRC_CHUNKS)) {
    const n = copyRecursive(SRC_CHUNKS, path.join(ASSETS, 'static', 'chunks'));
    console.log(`  Copied ${n} files to _assets/static/chunks/`);
}

console.log('\n=== Step 3: Copy CSS from .next to _assets/ ===');
if (fs.existsSync(SRC_CSS)) {
    const n = copyRecursive(SRC_CSS, ASSETS);
    console.log(`  Copied ${n} CSS files to _assets/`);
}

console.log('\n=== Step 4: Copy media from .next to _assets/ ===');
const SRC_MEDIA = path.join(__dirname, '.next', 'static', 'media');
if (fs.existsSync(SRC_MEDIA)) {
    const n = copyRecursive(SRC_MEDIA, path.join(ASSETS, 'media'));
    console.log(`  Copied ${n} media files to _assets/media/`);
}

console.log('\n=== Step 5: Fix turbopack runtime (/_next/ -> /_assets/) ===');
let rtFixed = 0;
for (const f of fs.readdirSync(ASSETS)) {
    if (f.endsWith('.js')) {
        const fp = path.join(ASSETS, f);
        let c = fs.readFileSync(fp, 'utf8');
        if (c.includes('let t="/_next/"')) {
            c = c.replace('let t="/_next/"', 'let t="/_assets/"');
            fs.writeFileSync(fp, c);
            rtFixed++;
            console.log('  Fixed:', f);
        }
    }
}
console.log(`  Fixed ${rtFixed} runtime files`);

console.log('\n=== Step 6: Fix HTML (keep /_assets/static/chunks/ for JS, /_assets/ for CSS) ===');
function walkDir(dir) {
    const r = [];
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
        const fp = path.join(dir, item.name);
        if (item.isDirectory()) r.push(...walkDir(fp));
        else if (item.name.endsWith('.html')) r.push(fp);
    }
    return r;
}

const htmlFiles = walkDir(OUT);
let htmlFixed = 0;
for (const file of htmlFiles) {
    let c = fs.readFileSync(file, 'utf8');
    const orig = c;
    // Keep the HTML referencing /_assets/static/chunks/xxx.js for JS
    // (same path that turbopack runtime builds)
    c = c.replace(/\/_next\/static\/chunks\//g, '/_assets/static/chunks/');
    // CSS and media stay flat in _assets/
    c = c.replace(/\/_next\/static\/css\//g, '/_assets/');
    c = c.replace(/\/_next\/static\/media\//g, '/_assets/');
    if (c !== orig) {
        fs.writeFileSync(file, c);
        htmlFixed++;
    }
}
console.log(`  Fixed ${htmlFixed} HTML files`);

console.log('\n=== Step 7: Remove .htaccess and _redirects ===');
for (const f of ['htaccess', '_redirects']) {
    const fp = path.join(OUT, f);
    if (fs.existsSync(fp)) {
        fs.unlinkSync(fp);
        console.log(`  Removed ${f}`);
    }
}

console.log('\n=== Step 8: Verify ===');
let remaining = 0;
for (const f of htmlFiles) {
    if (fs.readFileSync(f, 'utf8').includes('/_next/')) remaining++;
}
console.log(`  HTML files still referencing _next/: ${remaining}`);

console.log('\n=== Step 9: Verify turbopack runtime has /_assets/ ===');
for (const f of fs.readdirSync(ASSETS)) {
    if (f.startsWith('turbopack') && f.endsWith('.js')) {
        const c = fs.readFileSync(path.join(ASSETS, f), 'utf8');
        const hasAssets = c.includes('let t="/_assets/"');
        const hasNext = c.includes('let t="/_next/"');
        console.log(`  ${f}: /_assets/=${hasAssets}, /_next/=${hasNext}`);
    }
}

console.log('\n=== Step 10: Count files in _assets/static/chunks/ ===');
const staticChunksDir = path.join(ASSETS, 'static', 'chunks');
if (fs.existsSync(staticChunksDir)) {
    const count = fs.readdirSync(staticChunksDir).filter(f => !fs.statSync(path.join(staticChunksDir, f)).isDirectory()).length;
    console.log(`  Files in _assets/static/chunks/: ${count}`);
}

console.log('\n=== Step 11: Create zip ===');
const zipPath = path.join(__dirname, 'deploy.zip');
if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
execSync(`Compress-Archive -Path "${OUT}\\*" -DestinationPath "${zipPath}" -Force`, { stdio: 'inherit' });
const stats = fs.statSync(zipPath);
console.log(`  Zip: ${zipPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
console.log('\n=== DONE ===');
