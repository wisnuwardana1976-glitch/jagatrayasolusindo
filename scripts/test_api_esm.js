import http from 'http';

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/inventory-adjustments',
    method: 'GET'
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
