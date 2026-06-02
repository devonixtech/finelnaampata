const fetch = require('node-fetch');
require('dotenv').config({ path: './backend/.env' });

async function testApi() {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://local-business-listing-directory-production.up.railway.app/api/v1';
    const slug = 'bright-future-academy-mn8n7y7p';
    
    console.log(`Testing API: ${apiBaseUrl}/businesses/slug/${slug}`);
    
    try {
        const response = await fetch(`${apiBaseUrl}/businesses/slug/${slug}`);
        if (!response.ok) {
            console.error(`Status: ${response.status}`);
            return;
        }
        const data = await response.json();
        console.log('Business Name:', data.name || data.title);
        console.log('FAQs:', JSON.stringify(data.faqs, null, 2));
    } catch (err) {
        console.error('Error:', err.message);
    }
}

testApi();

