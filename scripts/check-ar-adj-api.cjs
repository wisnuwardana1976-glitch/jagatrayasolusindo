const http = require('http');

// Check AR Adjustments
const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/ar-adjustments',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('AR Adjustments:');
            console.log(JSON.stringify(json, null, 2));
        } catch (e) {
            console.log('Raw response:', data);
        }
    });
});

req.on('error', (e) => {
    console.error('Error:', e.message);
});

req.end();
