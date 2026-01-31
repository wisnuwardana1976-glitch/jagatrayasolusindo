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
            if (json.success) {
                console.log('Outstanding Count:', json.data.length);
                const summary = {};
                json.data.forEach(i => {
                    summary[i.partner_name] = (summary[i.partner_name] || 0) + 1;
                });
                console.log('Partners Summary:', JSON.stringify(summary, null, 2));
            } else {
                console.log('Error:', json.error);
            }
        } catch (e) {
            console.log('Error parsing:', e);
        }
    });
});

req.end();
