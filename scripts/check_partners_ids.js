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
            const mj = json.data.find(p => p.name.includes('Maju') || p.name.includes('Jaya'));
            const jr = json.data.find(p => p.id == 2);

            console.log('PT Maju Jaya:', mj ? JSON.stringify(mj) : 'Not Found');
            console.log('ID 2 is:', jr ? jr.name : 'Not Found');
        } catch (e) {
            console.log(e);
        }
    });
});
req.end();
