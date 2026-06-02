const http = require('http');

async function request(options, body) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({
                statusCode: res.statusCode,
                body: JSON.parse(data || '{}')
            }));
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function testAuth() {
    const email = `test_${Date.now()}@example.com`;
    const password = 'password123';

    try {
        console.log('ðŸ§ª Testing Registration...');
        const regRes = await request({
            hostname: process.env.API_HOST || 'api.yourdomain.com',
            port: process.env.PORT || 3001,
            path: '/api/v1/auth/register',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { email, password, fullName: 'Test Name' });

        console.log('Registration Status:', regRes.statusCode);
        console.log('Registration Body:', regRes.body);

        if (regRes.statusCode === 201 || regRes.statusCode === 200) {
            console.log('\nðŸ§ª Testing Login...');
            const loginRes = await request({
                hostname: process.env.API_HOST || 'api.yourdomain.com',
                port: process.env.PORT || 3001,
                path: '/api/v1/auth/login',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }, { email, password });

            console.log('Login Status:', loginRes.statusCode);
            console.log('Login Body:', loginRes.body);

            if (loginRes.body.token && loginRes.body.user) {
                console.log('\nâœ… Auth Flow Verified Successfully!');
            } else {
                console.log('\nâŒ Auth Flow Failed: Missing token or user info');
            }
        } else {
            console.log('\nâŒ Registration Failed');
        }
    } catch (err) {
        console.error('\nâŒ Test Error:', err.message);
    }
}

testAuth();

