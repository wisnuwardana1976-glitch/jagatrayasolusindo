import http from 'http';

const data = JSON.stringify({
    doc_number: "AUTO",
    doc_date: "2026-01-31",
    adjustment_type: "IN",
    transcode_id: 1, // Pastikan ID valid
    warehouse_id: 1, // Pastikan ID valid
    counter_account_id: 1, // Pastikan ID valid
    notes: "Test script",
    allocate_to_invoice: "N",
    items: []
});

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/inventory-adjustments',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.on('data', d => process.stdout.write(d));
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
