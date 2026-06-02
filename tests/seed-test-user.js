const http = require('http');

const data = JSON.stringify({
  fullName: 'Test Vendor',
  email: 'testvendor@naampata.com',
  password: 'Test1234!',
  role: 'vendor'
});

const req = http.request('https://local-business-listing-directory-production.up.railway.app/api/v1/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body);
  });
});

req.on('error', console.error);
req.write(data);
req.end();

