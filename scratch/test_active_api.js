
const { execSync } = require('child_process');

// Note: jsonwebtoken might not be in root, but it should be in backend
let jwt;
try {
    jwt = require('./backend/node_modules/jsonwebtoken');
} catch (e) {
    console.log('jsonwebtoken not found in backend, trying common path...');
    // Fallback or skip JWT generation if not found
}

const SECRET = 'super-secret-key-change-this-in-production';
const API_URL = 'https://local-business-listing-directory-production.up.railway.app/api/v1';

async function testActivePlanAPI() {
    const userId = '251648a1-cc80-4da2-887e-97ecb872b251';
    
    let token;
    if (jwt) {
        token = jwt.sign({ sub: userId, email: 'amanjeetthakur644@gmail.com' }, SECRET, { expiresIn: '1h' });
    } else {
        console.log('JWT module not found. Please provide a token manually or ensure jsonwebtoken is installed.');
        return;
    }
    
    console.log(`Testing /subscriptions/active for User: ${userId}`);
    
    try {
        const cmd = `curl -s -H "Authorization: Bearer ${token}" ${API_URL}/subscriptions/active`;
        const resStr = execSync(cmd).toString();
        const res = JSON.parse(resStr);
        
        console.log('Response:', JSON.stringify(res, null, 2));
        
        if (res && res.plan && res.plan.name === 'Free') {
            console.log('âœ… Fallback to Free plan confirmed!');
        } else {
            console.log('âŒ Fallback failed or different plan returned.');
        }
    } catch (error) {
        console.error('API call failed:', error.message);
    }
}

testActivePlanAPI();

