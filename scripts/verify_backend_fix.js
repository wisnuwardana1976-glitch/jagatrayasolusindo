import http from 'http';

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/journals/95',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.success) {
                console.log('Success!');
                console.log('Sample Detail:', JSON.stringify(json.data.details[0], null, 2));
            } else {
                console.log('API Error:', json.message || json.error);
            }
        } catch (e) {
            console.log('Parse Error:', e);
            console.log('Body:', data);
        }
    });
});

req.on('error', e => console.log('Network Error:', e));
req.end();
