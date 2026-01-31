import http from 'http';

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/entities',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('Success:', json.success);
            if (json.data && json.data.length > 0) {
                const p = json.data[0];
                console.log('Sample Entity:', JSON.stringify(p));
                console.log('ID Type:', typeof p.id);
            } else {
                console.log('No entities found');
            }
        } catch (e) {
            console.log('Error parsing:', e);
            console.log('Body:', data);
        }
    });
});

req.on('error', e => console.log('Error:', e));
req.end();
