const fetch = require('node-fetch');

async function test() {
    try {
        const res = await fetch('https://local-business-listing-directory-production.up.railway.app/api/v1/businesses/search?limit=1');
        const data = await res.json();
        console.log("Meta:", data.meta);
    } catch (err) {
        console.error(err);
    }
}

test();
