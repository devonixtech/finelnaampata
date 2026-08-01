import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const archiver = require('archiver');
import { createWriteStream } from 'fs';
import { resolve } from 'path';

const outDir = resolve(import.meta.dirname, 'out');
const dest = resolve('C:\\Users\\Ahmed Bilal Khan\\Desktop\\naampata-dist.zip');

const output = createWriteStream(dest);
const archive = archiver('zip', { zlib: { level: 6 } });

archive.pipe(output);

output.on('close', () => {
    console.log(`Done! ${archive.pointer()} bytes (${(archive.pointer() / 1024 / 1024).toFixed(2)} MB)`);
});

archive.on('error', (err) => { throw err; });

archive.glob('**/*', { cwd: outDir, dot: true });

await archive.finalize();
