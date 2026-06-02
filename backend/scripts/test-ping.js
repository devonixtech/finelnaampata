const http = require('http');

async function testPing() {
    const options = {
        hostname: process.env.API_HOST || 'api.yourdomain.com',
        port: 3001,
        path: '/api/v1/auth/ping',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer INVALID_TOKEN'
        }
    };

    const req = http.request(options, (res) => {
        console.log(`Status Code: ${res.statusCode}`);
        res.on('data', (d) => {
            process.stdout.write(d);
        });
    });

    req.on('error', (error) => {
        console.error('Error:', error);
    });

    req.end();
}

testPing();

