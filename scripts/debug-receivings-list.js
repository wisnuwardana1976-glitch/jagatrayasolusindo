
async function run() {
    try {
        console.log('Fetching Receivings List...');
        const response = await fetch('http://localhost:3001/api/receivings');
        const json = await response.json();

        if (!json.success) {
            console.error('API Error:', json.error);
            return;
        }

        console.log('--- Receivings List Inspection ---');
        const receivings = json.data;
        if (!receivings || receivings.length === 0) {
            console.log('No receivings found.');
            return;
        }

        receivings.forEach(r => {
            console.log(`Doc: ${r.doc_number}, Status: ${r.status}`);
            console.log(`  Total Received: ${r.total_received} (${typeof r.total_received})`);
            console.log(`  Total Billed:   ${r.total_billed} (${typeof r.total_billed})`);

            const received = parseFloat(r.total_received || 0);
            const billed = parseFloat(r.total_billed || 0);
            const isLocked = billed >= received && received > 0;
            console.log(`  Locked? ${isLocked} (Billed >= Received)`);
        });

    } catch (error) {
        console.error('Fetch error:', error);
    }
}
run();
