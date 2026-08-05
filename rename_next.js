const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'apps', 'web', 'out');
const oldNext = path.join(outDir, '_next');
const newNext = path.join(outDir, 'n_assets');

// 1. Rename the folder
if (fs.existsSync(oldNext)) {
    fs.renameSync(oldNext, newNext);
    console.log('Renamed _next to n_assets');
}

// 2. Find and replace in all files
function walkSync(dir, callback) {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
        const filepath = path.join(dir, file);
        const stats = fs.statSync(filepath);
        if (stats.isDirectory()) {
            walkSync(filepath, callback);
        } else if (stats.isFile()) {
            callback(filepath);
        }
    });
}

let count = 0;
walkSync(outDir, (filepath) => {
    const ext = path.extname(filepath);
    if (['.html', '.js', '.css', '.txt'].includes(ext)) {
        let content = fs.readFileSync(filepath, 'utf8');
        let updated = false;
        
        // Replace /_next/ with /n_assets/
        if (content.includes('/_next/')) {
            content = content.split('/_next/').join('/n_assets/');
            updated = true;
        }
        
        // Replace "_next/" with "n_assets/"
        if (content.includes('"_next/')) {
            content = content.split('"_next/').join('"n_assets/');
            updated = true;
        }

        // Replace `_next/` with `n_assets/`
        if (content.includes('`_next/')) {
            content = content.split('`_next/').join('`n_assets/');
            updated = true;
        }
        
        // Replace '_next/' with 'n_assets/'
        if (content.includes("'_next/")) {
            content = content.split("'_next/").join("'n_assets/");
            updated = true;
        }
        
        if (updated) {
            fs.writeFileSync(filepath, content, 'utf8');
            count++;
        }
    }
});

console.log('Completed replacing _next with n_assets in ' + count + ' files');
