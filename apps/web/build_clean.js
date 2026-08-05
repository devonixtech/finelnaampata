const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUT = path.join(__dirname, 'out');

console.log('=== build_clean.js ===');
console.log('assetPrefix approach: move out/_next/ -> out/_assets/_next/');

// 1. Move out/_next/ -> out/_assets/_next/
const nextDir = path.join(OUT, '_next');
const assetsNextDir = path.join(OUT, '_assets', '_next');

if (fs.existsSync(nextDir)) {
    console.log('1. Moving _next/ -> _assets/_next/');
    fs.mkdirSync(path.join(OUT, '_assets'), { recursive: true });
    fs.renameSync(nextDir, assetsNextDir);
    console.log('   Done');
} else if (fs.existsSync(assetsNextDir)) {
    console.log('1. _assets/_next/ already exists, skipping move');
} else {
    console.log('1. ERROR: Neither _next/ nor _assets/_next/ found!');
}

// 2. Remove unnecessary files
console.log('2. Cleanup');
for (const f of ['.htaccess', '_redirects', 'sw.js']) {
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

// 3. Verify
console.log('3. Verification');
const htmlFiles = [];
function walkHtml(dir) {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
        const fp = path.join(dir, f.name);
        if (f.isDirectory()) walkHtml(fp);
        else if (f.name.endsWith('.html')) htmlFiles.push(fp);
    }
}
walkHtml(OUT);

let unprefixedHtml = 0;
let totalRefs = 0;
for (const f of htmlFiles) {
    const c = fs.readFileSync(f, 'utf8');
    const unprefixed = (c.match(/(?<!\/_assets)\/_next\//g) || []).length;
    const prefixed = (c.match(/\/_assets\/_next\//g) || []).length;
    if (unprefixed > 0) unprefixedHtml++;
    totalRefs += prefixed;
}
console.log(`   HTML files: ${htmlFiles.length}`);
console.log(`   HTML with unprefixed /_next/: ${unprefixedHtml} (should be 0)`);
console.log(`   Total /_assets/_next/ refs in HTML: ${totalRefs}`);

const chunkDir = path.join(assetsNextDir, 'static', 'chunks');
if (fs.existsSync(chunkDir)) {
    const chunkCount = fs.readdirSync(chunkDir).filter(f => fs.statSync(path.join(chunkDir, f)).isFile()).length;
    console.log(`   Chunk files: ${chunkCount}`);

    // Check turbopack runtime
    const turbo = fs.readdirSync(chunkDir).find(f => f.startsWith('turbopack-'));
    if (turbo) {
        const tc = fs.readFileSync(path.join(chunkDir, turbo), 'utf8');
        const basePath = tc.match(/let\s+t="([^"]+)"/);
        console.log(`   Turbopack base path: ${basePath ? basePath[1] : 'NOT FOUND'}`);
    }
} else {
    console.log('   ERROR: static/chunks/ not found!');
}

// Check for stale _next at root
if (fs.existsSync(nextDir)) {
    console.log('   WARNING: Stale _next/ still exists at root!');
}

console.log('\nDONE - create zip with: Compress-Archive -Path out\\* -DestinationPath deploy.zip');
