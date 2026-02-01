const http = require('http');

// Test AR invoices for allocation - partner_id 3 (Toko Komputer ABC)
const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/ar-invoices/for-allocation?partner_id=3',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('AR Invoices for Allocation (Partner ID 3):');
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
