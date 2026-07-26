#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { resolve } from 'path';

const DIR = resolve(import.meta.dirname, 'app');
const files = [
  `${DIR}/cities/[cityName]/page.tsx`,
  `${DIR}/categories/[categorySlug]/page.tsx`,
  `${DIR}/business/[businessSlug]/page.tsx`,
  `${DIR}/offers-events/[offerId]/page.tsx`,
];

const backups = files.map(f => ({ file: f, content: readFileSync(f, 'utf-8') }));

console.log('Step 1: Patching for static export...');
for (const { file, content } of backups) {
  let newContent = content;
  newContent = newContent.replace(/export const dynamicParams = true;/g, 'export const dynamicParams = false;');
  // If generateStaticParams returns [], change to return template
  newContent = newContent.replace(/return \[\];/g, (match) => {
    // Only replace inside generateStaticParams
    return match;
  });
  writeFileSync(file, newContent, 'utf-8');
}

// Fix generateStaticParams for each file specifically
const gspPatches = [
  { file: `${DIR}/cities/[cityName]/page.tsx`, search: 'return [];', replace: "return [{ cityName: 'template' }];" },
  { file: `${DIR}/categories/[categorySlug]/page.tsx`, search: 'return [];', replace: "return [{ categorySlug: 'template' }];" },
  { file: `${DIR}/offers-events/[offerId]/page.tsx`, search: 'return [];', replace: "return [{ offerId: 'template' }];" },
];

for (const p of gspPatches) {
  const content = readFileSync(p.file, 'utf-8');
  const newContent = content.replace(p.search, p.replace);
  writeFileSync(p.file, newContent, 'utf-8');
}

console.log('Step 2: Building static export...');
try {
  execSync('npx next build', {
    cwd: import.meta.dirname,
    stdio: 'inherit',
    env: { ...process.env, STATIC_EXPORT: 'true', NODE_ENV: 'production' }
  });
  console.log('\nBuild successful! Output in ./out/');
} finally {
  console.log('Step 3: Restoring original files...');
  for (const { file, content } of backups) {
    writeFileSync(file, content, 'utf-8');
    console.log(`  Restored: ${file.split('\\').pop()}`);
  }
  console.log('All files restored. Live site unaffected.');
}
