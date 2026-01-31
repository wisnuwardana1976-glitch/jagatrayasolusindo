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
            const p4 = json.data.find(p => p.id == 4);
            console.log('Partner 4:', p4 ? JSON.stringify(p4) : 'Not Found');
        } catch (e) {
            console.log(e);
        }
    });
});
req.end();
