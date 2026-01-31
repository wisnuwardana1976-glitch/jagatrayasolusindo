import http from 'http';

// ID Adjustment yang ingin di-unpost (ambil dari Ref ID di screenshot user: 1)
const id = 1;

const options = {
    hostname: 'localhost',
    port: 3001,
    path: `/api/inventory-adjustments/${id}/unpost`,
    method: 'PUT'
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log(`BODY: ${data}`);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
