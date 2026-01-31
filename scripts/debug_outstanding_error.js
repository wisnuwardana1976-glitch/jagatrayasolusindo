import http from 'http';

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/invoices/outstanding',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (!json.success) {
                console.log('API Failed. Reason:', json.message || json.error);
                console.log('Full Response:', data);
            } else {
                console.log('API Success');
            }
        } catch (e) {
            console.log('Error parsing:', e);
        }
    });
});

req.end();
