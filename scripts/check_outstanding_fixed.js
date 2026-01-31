import http from 'http';

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/invoices/outstanding?type=AP',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('Success:', json.success);
            if (json.success) {
                console.log('Data Length:', json.data.length);
                if (json.data.length > 0) {
                    console.log('Sample:', JSON.stringify(json.data[0]));
                    console.log('Partner ID Type:', typeof json.data[0].partner_id);
                }
            } else {
                console.log('Error:', json.error);
            }
        } catch (e) {
            console.log('Error parsing:', e);
        }
    });
});

req.end();
