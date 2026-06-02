const http = require('http');

const options = (path, method, headers = {}) => ({
    hostname: process.env.API_HOST || 'api.yourdomain.com',
    port: 3001,
    path: `/api/v1${path}`,
    method,
    headers: {
        'Content-Type': 'application/json',
        ...headers
    }
});

function request(path, method, body, headers) {
    return new Promise((resolve, reject) => {
        const req = http.request(options(path, method, headers), (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, data });
                }
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function testBackend() {
    try {
        console.log('--- Testing Login (Admin) ---');
        const loginRes = await request('/auth/login', 'POST', {
            email: 'admin@example.com',
            password: 'Password123!',
        });

        if (loginRes.status !== 200 && loginRes.status !== 201) {
            console.error('Login failed:', loginRes.status, loginRes.data);
            return;
        }

        console.log('Login successful');
        const token = loginRes.data.tokens.accessToken;

        console.log('\n--- Testing Profile Fetch ---');
        const profileRes = await request('/users/profile', 'GET', null, {
            Authorization: `Bearer ${token}`
        });

        console.log(`Profile Fetch Result (Status: ${profileRes.status}):`);
        console.log(JSON.stringify(profileRes.data, null, 2));

    } catch (error) {
        console.error('Test Error:', error.message);
    }
}

testBackend();

