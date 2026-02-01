const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/reports/ar-outstanding',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('AR Outstanding Report:');
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
