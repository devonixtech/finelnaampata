const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'out');
const NEXT = path.join(OUT, '_next');
const S_DIR = path.join(OUT, 's');

console.log('=== build_s.js: Replace /_next/ with /s/ everywhere ===\n');

// 1. Copy _next/ -> s/ (preserve structure)
console.log('1. Copy _next/ -> s/');
function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    let c = 0;
    for (const f of fs.readdirSync(src, { withFileTypes: true })) {
        const sp = path.join(src, f.name);
        const dp = path.join(dest, f.name);
        if (f.isDirectory()) { c += copyDir(sp, dp); }
        else { fs.copyFileSync(sp, dp); c++; }
    }
    return c;
}
const fileCount = copyDir(NEXT, S_DIR);
console.log(`   Copied ${fileCount} files to s/`);

// 2. Fix ALL HTML files: replace /_next/ -> /s/
console.log('\n2. Fix HTML files: /_next/ -> /s/');
function walkFiles(dir, ext) {
    const r = [];
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
        const fp = path.join(dir, f.name);
        if (f.isDirectory()) r.push(...walkFiles(fp, ext));
        else if (f.name.endsWith(ext)) r.push(fp);
    }
    return r;
}
const htmlFiles = walkFiles(OUT, '.html');
let htmlFixed = 0;
for (const f of htmlFiles) {
    let c = fs.readFileSync(f, 'utf8');
    const o = c;
    c = c.replace(/\/_next\//g, '/s/');
    if (c !== o) { fs.writeFileSync(f, c); htmlFixed++; }
}
console.log(`   Fixed ${htmlFixed}/${htmlFiles.length} HTML files`);

// 3. Fix ALL JS files in s/: replace /_next/ -> /s/
console.log('\n3. Fix JS files in s/: /_next/ -> /s/');
const jsFiles = walkFiles(S_DIR, '.js');
let jsFixed = 0;
for (const f of jsFiles) {
    let c = fs.readFileSync(f, 'utf8');
    const o = c;
    c = c.replace(/\/_next\//g, '/s/');
    if (c !== o) { fs.writeFileSync(f, c); jsFixed++; }
}
console.log(`   Fixed ${jsFixed}/${jsFiles.length} JS files`);

// 4. Fix CSS files in s/: replace /_next/ -> /s/
console.log('\n4. Fix CSS files in s/: /_next/ -> /s/');
const cssFiles = walkFiles(S_DIR, '.css');
let cssFixed = 0;
for (const f of cssFiles) {
    let c = fs.readFileSync(f, 'utf8');
    const o = c;
    c = c.replace(/\/_next\//g, '/s/');
    if (c !== o) { fs.writeFileSync(f, c); cssFixed++; }
}
console.log(`   Fixed ${cssFixed}/${cssFiles.length} CSS files`);

// 5. Cleanup
console.log('\n5. Cleanup');
const cleanupFiles = ['.htaccess', '_redirects', 'sw.js', 'index.php', 'test_php.php'];
for (const f of cleanupFiles) {
    const fp = path.join(OUT, f);
    if (fs.existsSync(fp)) { fs.unlinkSync(fp); console.log(`   Removed ${f}`); }
}
// Remove .txt files at root
for (const f of fs.readdirSync(OUT)) {
    if (f.endsWith('.txt') || f.startsWith('__next.')) {
        const fp = path.join(OUT, f);
        if (fs.statSync(fp).isFile()) { fs.unlinkSync(fp); console.log(`   Removed ${f}`); }
    }
}

// 6. Verify: zero /_next/ references
console.log('\n6. Verification');
let nextInHtml = 0;
for (const f of htmlFiles) {
    if (fs.readFileSync(f, 'utf8').includes('/_next/')) nextInHtml++;
}
let nextInJs = 0;
for (const f of jsFiles) {
    if (fs.readFileSync(f, 'utf8').includes('/_next/')) nextInJs++;
}
console.log(`   HTML with /_next/: ${nextInHtml} (should be 0)`);
console.log(`   JS with /_next/: ${nextInJs} (should be 0)`);
console.log(`   _next/ exists: ${fs.existsSync(NEXT)} (should be false)`);
console.log(`   s/ exists: ${fs.existsSync(S_DIR)}`);
console.log(`   s/static/chunks/ files: ${fs.readdirSync(path.join(S_DIR, 'static', 'chunks')).filter(f => fs.statSync(path.join(S_DIR, 'static', 'chunks', f)).isFile()).length}`);

// Check turbopack runtime base path
const turbo = fs.readdirSync(path.join(S_DIR, 'static', 'chunks')).find(f => f.startsWith('turbopack-'));
if (turbo) {
    const tc = fs.readFileSync(path.join(S_DIR, 'static', 'chunks', turbo), 'utf8');
    const m = tc.match(/let\s+t="([^"]+)"/);
    console.log(`   Turbopack base path: ${m ? m[1] : 'NOT FOUND'}`);
}

// Check a sample HTML for /s/ references
const indexHtml = fs.readFileSync(path.join(OUT, 'index.html'), 'utf8');
const scriptSrcs = indexHtml.match(/src="([^"]+)"/g) || [];
console.log(`   Sample HTML script srcs: ${scriptSrcs.slice(0, 3).join(', ')}`);

console.log('\nDONE - create zip now');
