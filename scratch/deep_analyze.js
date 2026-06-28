const fs = require('fs');
const path = require('path');

function fileContains(filePath, pattern) {
    if (!fs.existsSync(filePath)) return false;
    const content = fs.readFileSync(filePath, 'utf8');
    if (typeof pattern === 'string') return content.includes(pattern);
    return pattern.test(content);
}

function findInDir(dir, pattern, results = []) {
    if (!fs.existsSync(dir)) return results;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.next') && !file.includes('.git')) {
                findInDir(fullPath, pattern, results);
            }
        } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')) {
            if (fileContains(fullPath, pattern)) {
                results.push(fullPath);
            }
        }
    }
    return results;
}

console.log('=== DEEP ANALYSIS RESULTS ===');

// 1. Sign Up / Sign In
console.log('\n--- 1. SIGN UP / SIGN IN ---');
console.log('Google Auth in web:', findInDir('apps/web', 'google'));
console.log('Forgot Password page exists:', fs.existsSync('apps/web/app/forgot-password/page.tsx') || fs.existsSync('apps/web/app/(auth)/forgot-password/page.tsx'));
const loginContent = fs.readFileSync('apps/web/app/login/page.tsx', 'utf8');
console.log('Login has forgot password link:', loginContent.includes('forgot-password') || loginContent.includes('Forgot'));
console.log('Login has "List My Business" text:', loginContent.includes('List My Business') || loginContent.includes('List your business'));

// 2. Location & Maps
console.log('\n--- 2. LOCATION & MAPS ---');
console.log('Countries database files:', findInDir('apps/web', 'countries'));
console.log('Location detect files:', findInDir('apps/web', 'location'));
console.log('Google maps embed vs API:', findInDir('apps/web', 'maps.googleapis.com'));

// 3. Search
console.log('\n--- 3. SEARCH ---');
console.log('Search pages:', findInDir('apps/web/app', 'search'));
const searchFile = 'apps/web/app/search/page.tsx';
if (fs.existsSync(searchFile)) {
    const sContent = fs.readFileSync(searchFile, 'utf8');
    console.log('Search sort options:', sContent.includes('Featured') || sContent.includes('Recent'));
}

// 4. Listing (Business Setup)
console.log('\n--- 4. LISTING / BUSINESS SETUP ---');
const setupFile = 'apps/web/app/business-setup/page.tsx';
if (fs.existsSync(setupFile)) {
    const bContent = fs.readFileSync(setupFile, 'utf8');
    console.log('Business setup has Multiple Branches:', bContent.includes('Multiple Branches'));
    console.log('Business setup has Franchise Location:', bContent.includes('Franchise Location'));
    console.log('Business setup step 13 dropdown:', bContent.includes('Year Established') || bContent.includes('yearEstablished'));
    console.log('E.164 label:', bContent.includes('E.164'));
    console.log('TikTok / Twitter:', bContent.includes('tiktok') || bContent.includes('twitter') || bContent.includes('TikTok') || bContent.includes('Twitter'));
}

// 5. Offers & Events
console.log('\n--- 5. OFFERS & EVENTS ---');
console.log('Offers page exists:', fs.existsSync('apps/web/app/offers/page.tsx'));
console.log('Events page exists:', fs.existsSync('apps/web/app/events/page.tsx'));
if (fs.existsSync('apps/web/app/offers/page.tsx')) {
    console.log('Offers page content len:', fs.readFileSync('apps/web/app/offers/page.tsx', 'utf8').length);
}
if (fs.existsSync('apps/web/app/events/page.tsx')) {
    console.log('Events page content len:', fs.readFileSync('apps/web/app/events/page.tsx', 'utf8').length);
}

// 6. Expert Quote & Broadcast
console.log('\n--- 6. EXPERT QUOTE & BROADCAST ---');
console.log('Broadcast files:', findInDir('apps/web', 'broadcast'));
console.log('Expert quote files:', findInDir('apps/web', 'quote') || findInDir('apps/web', 'expert'));

