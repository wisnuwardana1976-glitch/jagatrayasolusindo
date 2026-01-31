import http from 'http';

const data = JSON.stringify({
    doc_number: "AUTO",
    doc_date: "2026-01-31",
    description: "Test Allocation via Script",
    transcode_id: 13, // BCAO (13)
    source_type: "MANUAL",
    is_giro: 0,
    details: [
        {
            coa_id: 16, // Hutang Dagang (ID 16 based on prev check)
            description: "Payment Allocated",
            debit: 50000,
            credit: 0,
            ref_id: 4, // Invoice ID 4
            ref_type: "AP"
        },
        {
            coa_id: 1, // Bank Account (assuming ID 1 exists)
            description: "Bank Out",
            debit: 0,
            credit: 50000
        }
    ]
});

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/journals',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => console.log('BODY:', body));
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
