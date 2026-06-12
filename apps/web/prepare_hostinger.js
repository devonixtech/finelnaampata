const fs = require('fs');
const path = require('path');

const copyDir = (src, dest) => {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
};

const rootDir = process.cwd();
const standaloneDir = path.join(rootDir, '.next', 'standalone');
const targetStandaloneAppsWebDir = path.join(standaloneDir, 'apps', 'web');

// 1. Copy public
if (fs.existsSync(path.join(rootDir, 'public'))) {
  copyDir(path.join(rootDir, 'public'), path.join(targetStandaloneAppsWebDir, 'public'));
}

// 2. Copy .next/static
if (fs.existsSync(path.join(rootDir, '.next', 'static'))) {
  copyDir(path.join(rootDir, '.next', 'static'), path.join(targetStandaloneAppsWebDir, '.next', 'static'));
}

// 3. Copy .env.production to .env in standalone root
if (fs.existsSync(path.join(rootDir, '.env.production'))) {
  fs.copyFileSync(path.join(rootDir, '.env.production'), path.join(targetStandaloneAppsWebDir, '.env'));
}

// 4. Copy content directory
if (fs.existsSync(path.join(rootDir, 'content'))) {
  copyDir(path.join(rootDir, 'content'), path.join(targetStandaloneAppsWebDir, 'content'));
}

console.log("Standalone build prepared successfully.");
