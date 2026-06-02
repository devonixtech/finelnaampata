const http = require('http');

async function testAuth() {
    const email = `test_phone_${Date.now()}@example.com`;
    const password = 'Password@123';
    const fullName = 'Test Phone User';
    const phone = '+1234567890';

    console.log(`Registering user ${email} with phone ${phone}...`);

    // 1. Register User
    const regRes = await fetch('https://local-business-listing-directory-production.up.railway.app/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, phone })
    });

    const regData = await regRes.json();
    console.log('Register Response:', regRes.status, regData);

    if (regRes.status !== 201) return;

    const token = regData.tokens.accessToken;

    // 2. Fetch Profile
    const profRes = await fetch('https://local-business-listing-directory-production.up.railway.app/api/v1/users/profile', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    const profData = await profRes.json();
    console.log('Profile after register:', profData.phone === phone ? 'SUCCESS: Phone matches' : 'ERROR: Phone mismatch', profData.phone);

    // 3. Login with different phone to update it
    const newPhone = '+1987654321';
    console.log(`\nLogging in and updating phone to ${newPhone}...`);
    const loginRes = await fetch('https://local-business-listing-directory-production.up.railway.app/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, phone: newPhone })
    });
    const loginData = await loginRes.json();
    console.log('Login Response:', loginRes.status, loginData.user.phone === newPhone ? 'SUCCESS: Phone updated' : 'ERROR: Phone mismatch', loginData.user.phone);
}

testAuth().catch(console.error);

