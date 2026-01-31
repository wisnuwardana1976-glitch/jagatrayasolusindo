import http from 'http';

const id = 108; // Target ID

const options = {
    hostname: 'localhost',
    port: 3001,
    path: `/api/journals/${id}`,
    method: 'GET'
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('Details:', JSON.stringify(json.data.details, null, 2));
        } catch (e) {
            console.log('BODY:', data);
        }
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
