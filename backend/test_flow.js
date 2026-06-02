const fetch = require('node-fetch');

async function testFlow() {
    const API_URL = 'https://local-business-listing-directory-production.up.railway.app/api/v1';
    const TOKEN = 'YOUR_TEST_TOKEN'; // I need a token to test

    // 1. Calculate price with pricingId (Preview context)
    const calcRes = await fetch(`${API_URL}/promotions/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
        body: JSON.stringify({
            placements: ['listing'],
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 3600000).toISOString(),
            pricingId: 'UUID_OF_A_PLAN' 
        })
    });
    const calcData = await calcRes.json();
    console.log('Calculation result (with pricingId):', calcData);

    // 2. Book with offerEventId (No pricingId)
    const bookRes = await fetch(`${API_URL}/promotions/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
        body: JSON.stringify({
            offerEventId: 'UUID_OF_AN_OFFER', // This offer should already have pricingId set in DB
            placements: ['listing'],
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 3600000).toISOString()
        })
    });
    const bookData = await bookRes.json();
    console.log('Booking result (no pricingId):', bookData);
}

