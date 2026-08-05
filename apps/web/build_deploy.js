const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const OUT = path.join(__dirname, 'out');
const ASSETS = path.join(OUT, '_assets');
const CHUNKS_STATIC = path.join(ASSETS, 'static', 'chunks');
const NEXT_STATIC = path.join(OUT, '_next', 'static', 'chunks');

console.log('=== Step 1: Ensure directories exist ===');
[ASSETS, CHUNKS_STATIC].forEach(d => {
    fs.mkdirSync(d, { recursive: true });
    console.log('  Created:', d);
});

console.log('\n=== Step 2: Copy JS/CSS from .next/static/chunks to _assets/ ===');
const srcChunks = path.join(__dirname, '.next', 'static', 'chunks');
if (fs.existsSync(srcChunks)) {
    let copied = 0;
    function copyRecursive(src, dest) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        for (const item of fs.readdirSync(src, { withFileTypes: true })) {
            const srcPath = path.join(src, item.name);
            const destPath = path.join(dest, item.name);
            if (item.isDirectory()) {
                copyRecursive(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
                copied++;
            }
        }
    }
    copyRecursive(srcChunks, ASSETS);
    console.log(`  Copied ${copied} files from .next/static/chunks/ to _assets/`);
}

console.log('\n=== Step 3: Copy same files to _assets/static/chunks/ (for turbopack runtime) ===');
let copied2 = 0;
function copyRecursive2(src, dest) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src, { withFileTypes: true })) {
        const srcPath = path.join(src, item.name);
        const destPath = path.join(dest, item.name);
        if (item.isDirectory()) {
            copyRecursive2(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
            copied2++;
        }
    }
}
if (fs.existsSync(ASSETS)) {
    copyRecursive2(ASSETS, CHUNKS_STATIC);
    console.log(`  Copied ${copied2} files to _assets/static/chunks/`);
}

console.log('\n=== Step 4: Also copy _next/static/css to _assets/ ===');
const srcCss = path.join(__dirname, '.next', 'static', 'css');
if (fs.existsSync(srcCss)) {
    let cssCopied = 0;
    function copyCssRecursive(src, dest) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        for (const item of fs.readdirSync(src, { withFileTypes: true })) {
            const srcPath = path.join(src, item.name);
            const destPath = path.join(dest, item.name);
            if (item.isDirectory()) {
                copyCssRecursive(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
                cssCopied++;
            }
        }
    }
    copyCssRecursive(srcCss, ASSETS);
    console.log(`  Copied ${cssCopied} CSS files to _assets/`);
}

console.log('\n=== Step 5: Fix HTML references (_next/ → _assets/) ===');
function walkDir(dir) {
    const results = [];
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            results.push(...walkDir(fullPath));
        } else if (item.name.endsWith('.html')) {
            results.push(fullPath);
        }
    }
    return results;
}

const htmlFiles = walkDir(OUT);
let htmlFixed = 0;
for (const file of htmlFiles) {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;
    content = content.replace(/\/_next\/static\/chunks\//g, '/_assets/static/chunks/');
    content = content.replace(/\/_next\/static\/css\//g, '/_assets/');
    content = content.replace(/\/_next\/static\/media\//g, '/_assets/');
    if (content !== original) {
        fs.writeFileSync(file, content);
        htmlFixed++;
    }
}
console.log(`  Fixed ${htmlFixed} HTML files`);

console.log('\n=== Step 6: Fix turbopack runtime base path ===');
const jsFiles = walkDir(ASSETS).filter(f => f.endsWith('.js'));
let runtimeFixed = 0;
for (const file of jsFiles) {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;
    content = content.replace('let t="/_next/"', 'let t="/_assets/"');
    if (content !== original) {
        fs.writeFileSync(file, content);
        runtimeFixed++;
        console.log('  Fixed runtime:', path.basename(file));
    }
}
console.log(`  Fixed ${runtimeFixed} runtime files`);

console.log('\n=== Step 7: Remove .htaccess and _redirects ===');
['htaccess', '_redirects'].forEach(f => {
    const fp = path.join(OUT, f);
    if (fs.existsSync(fp)) {
        fs.unlinkSync(fp);
        console.log(`  Removed ${f}`);
    }
});

console.log('\n=== Step 8: Verify ===');
let remaining = 0;
for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('/_next/')) {
        remaining++;
    }
}
console.log(`  HTML files still referencing _next/: ${remaining}`);

console.log('\n=== Step 9: Create zip ===');
const zipPath = path.join(__dirname, 'deploy.zip');
if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
console.log('  Creating zip with PowerShell...');
execSync(`Compress-Archive -Path "${OUT}\\*" -DestinationPath "${zipPath}" -Force`, { stdio: 'inherit' });
const stats = fs.statSync(zipPath);
const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
console.log(`  Zip created: ${zipPath} (${sizeMB} MB)`);
console.log('\n=== DONE ===');
