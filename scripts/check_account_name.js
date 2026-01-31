import http from 'http';

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/accounts',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const accounts = JSON.parse(data).data;
        const target = accounts.find(a => a.code === '01.2001.001');
        console.log('Account:', target);
    });
});

req.on('error', (e) => {
    console.error(e);
});

req.end();
