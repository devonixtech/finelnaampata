const https = require('https');

https.get('https://lh3.googleusercontent.com/a/ACg8ocJ_CnO8v-CeyqWpbRPnYtFP5WiRxoeToCp7L6HRFFpLih9TjFcy=s96-c', (res) => {
    console.log('Status Code:', res.statusCode);
}).on('error', (e) => {
    console.error('Error:', e);
});
