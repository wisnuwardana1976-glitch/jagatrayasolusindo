
// Native fetch is available in Node 18+
// Running as module


async function run() {
    try {
        const response = await fetch('http://localhost:3001/api/receivings');
        const json = await response.json();

        if (!json.success) {
            console.error('API Error:', json.error);
            return;
        }

        console.log('--- Receivings Filter Verification ---');
        console.log('Doc Number      | Status   | Received | Billed   | Detail');
        console.log('----------------------------------------------------------');

        json.data.forEach(r => {
            const received = parseFloat(r.total_received || 0);
            const billed = parseFloat(r.total_billed || 0);
            const shouldShow = r.status === 'Approved' && (billed < received);

            console.log(`${r.doc_number.padEnd(15)} | ${r.status.padEnd(8)} | ${received.toString().padEnd(8)} | ${billed.toString().padEnd(8)} | ${shouldShow ? 'SHOW' : 'HIDE'}`);
        });

    } catch (error) {
        console.error('Fetch error:', error);
    }
}
run();
