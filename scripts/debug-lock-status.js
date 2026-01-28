
async function run() {
    try {
        console.log('Fetching Data...');
        const [recvRes, shipRes] = await Promise.all([
            fetch('http://localhost:3001/api/receivings'),
            fetch('http://localhost:3001/api/shipments')
        ]);

        const recvJson = await recvRes.json();
        const shipJson = await shipRes.json();

        console.log('\n=== RECEIVINGS LOCK STATUS ===');
        if (recvJson.success) {
            recvJson.data.filter(r => r.status !== 'Draft').forEach(r => {
                const received = parseFloat(r.total_received || 0);
                const billed = parseFloat(r.total_billed || 0);
                const isLocked = billed >= received && received > 0;

                if (isLocked) {
                    console.log(`[LOCKED] ${r.doc_number}: Received ${received}, Billed ${billed}`);
                } else {
                    console.log(`[OPEN]   ${r.doc_number}: Received ${received}, Billed ${billed}`);
                }
            });
        }

        console.log('\n=== SHIPMENTS LOCK STATUS ===');
        if (shipJson.success) {
            shipJson.data.filter(s => s.status !== 'Draft').forEach(s => {
                const shipped = parseFloat(s.total_shipped || 0);
                const billed = parseFloat(s.total_billed || 0);
                const isLocked = billed >= shipped && shipped > 0;

                if (isLocked) {
                    console.log(`[LOCKED] ${s.doc_number}: Shipped ${shipped}, Billed ${billed}`);
                } else {
                    console.log(`[OPEN]   ${s.doc_number}: Shipped ${shipped}, Billed ${billed}`);
                }
            });
        }

    } catch (error) {
        console.error('Error:', error);
    }
}
run();
