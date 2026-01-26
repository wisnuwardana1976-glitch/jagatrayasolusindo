
import http from 'http';

const data = JSON.stringify({
    code: 'TEST-QUOTES',
    name: 'Test Quotes Period',
    start_date: '2025-02-01',
    end_date: '2025-02-28',
    status: 'Open',
    active: 'Y',
    is_starting: 'Y'
});

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/accounting-periods',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        console.log(`Body: ${body}`);
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.write(data);
req.end();
