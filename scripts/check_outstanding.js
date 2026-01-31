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
            console.log('Success:', json.success);
            if (json.data && json.data.ap && json.data.ap.length > 0) {
                const item = json.data.ap[0];
                console.log('Sample AP Item:', JSON.stringify(item));
                console.log('Partner ID Type:', typeof item.partner_id);
            } else {
                console.log('No outstanding AP found');
                console.log('Full Data:', JSON.stringify(json.data));
            }
        } catch (e) {
            console.log('Error parsing:', e);
        }
    });
});

req.end();
