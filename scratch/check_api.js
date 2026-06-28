const http = require('http');

http.get('http://localhost:3001/api/v1/categories', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            console.log('API Status Code:', res.statusCode);
            console.log('Total categories returned by API:', parsed.length);
            if (parsed.length > 0) {
                console.log('Sample category from API:', parsed[0]);
            }
        } catch (e) {
            console.log('Failed to parse JSON response. Raw length:', data.length);
        }
    });
}).on('error', (err) => {
    console.error('API request error:', err.message);
});
