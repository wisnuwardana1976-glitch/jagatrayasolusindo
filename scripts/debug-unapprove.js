import http from 'http';

function makeRequest(path, method = 'GET') {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve({ statusCode: res.statusCode, data: data });
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.end();
    });
}

async function run() {
    try {
        console.log('Fetching POs...');
        const res = await makeRequest('/api/purchase-orders');
        const json = JSON.parse(res.data);

        if (!json.success) {
            console.error('Failed to fetch POs:', json);
            return;
        }

        const approvedPO = json.data.find(po => po.status === 'Approved');
        if (!approvedPO) {
            console.log('No Approved PO found to test.');
            return;
        }

        console.log(`Found Approved PO: ${approvedPO.doc_number} (ID: ${approvedPO.id})`);
        console.log('Attempting to unapprove...');

        const unapproveRes = await makeRequest(`/api/purchase-orders/${approvedPO.id}/unapprove`, 'PUT');
        console.log('Unapprove Status:', unapproveRes.statusCode);
        console.log('Unapprove Response:', unapproveRes.data);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

run();
