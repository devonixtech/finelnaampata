/**
 * Downloads ~4000 Google Business category display names from a public GitHub Gist
 * and writes tmp/gmb-categories.txt + rebuilds categories-list.json.
 *
 * Usage (repo root): node backend/scripts/download-gmb-categories-from-gist.js
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const GIST_RAW =
    'https://gist.githubusercontent.com/manchumahara/dc88a6b9b157ada5f02cb8408653b80f/raw/gistfile1.txt';

const repoRoot = path.resolve(__dirname, '../..');
const txtOut = path.join(repoRoot, 'tmp', 'gmb-categories.txt');

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https
            .get(url, (res) => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    return fetchUrl(res.headers.location).then(resolve).catch(reject);
                }
                if (res.statusCode !== 200) {
                    reject(new Error(`HTTP ${res.statusCode} for ${url}`));
                    res.resume();
                    return;
                }
                const chunks = [];
                res.on('data', (c) => chunks.push(c));
                res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
            })
            .on('error', reject);
    });
}

async function main() {
    console.log('Fetching public GMB category list from GitHub Gist...');
    const raw = await fetchUrl(GIST_RAW);
    let names;
    try {
        names = JSON.parse(raw);
    } catch {
        throw new Error('Gist response was not valid JSON array');
    }
    if (!Array.isArray(names) || names.length < 500) {
        throw new Error(`Expected 500+ categories, got ${Array.isArray(names) ? names.length : 0}`);
    }

    const lines = [...new Set(names.map((n) => String(n).trim()).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: 'base' }),
    );

    fs.mkdirSync(path.dirname(txtOut), { recursive: true });
    fs.writeFileSync(txtOut, lines.join('\n') + '\n', 'utf8');
    console.log(`Wrote ${lines.length} categories to ${txtOut}`);

    const { execSync } = require('child_process');
    execSync(`node "${path.join(__dirname, 'build-google-categories-list.js')}" "${txtOut}"`, {
        stdio: 'inherit',
        cwd: repoRoot,
    });
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
