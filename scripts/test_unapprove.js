import http from 'http';

// Ganti ID dengan ID adjustment yang ada (misal 1 atau 2)
const id = 1;

const options = {
    hostname: 'localhost',
    port: 3001,
    path: `/api/inventory-adjustments/${id}/unapprove`,
    method: 'PUT'
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
