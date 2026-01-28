
// Native fetch
async function run() {
    try {
        console.log('Fetching all shipments to find a candidate...');
        const listRes = await fetch('http://localhost:3001/api/shipments');
        const listJson = await listRes.json();

        if (!listJson.success) {
            console.error('List API Error:', listJson.error);
            return;
        }

        const shipments = listJson.data;
        if (shipments.length === 0) {
            console.log('No shipments found.');
            return;
        }

        const candidate = shipments[0]; // Just take the first one
        console.log(`Testing with Shipment: ${candidate.doc_number} (ID: ${candidate.id})`);
        console.log(`Total Shipped: ${candidate.total_shipped}, Total Billed: ${candidate.total_billed}`);

        const response = await fetch(`http://localhost:3001/api/shipments/${candidate.id}`);
        const json = await response.json();

        if (!json.success) {
            console.error('Detail API Error:', json.error);
            return;
        }

        console.log('--- Shipment Details Inspection ---');
        const details = json.data.details;
        if (!details || details.length === 0) {
            console.log('No details found.');
            return;
        }

        details.forEach((d, idx) => {
            console.log(`Item #${idx + 1}: ${d.item_name} (ID: ${d.item_id})`);
            console.log(`  Qty Shipped : ${d.quantity}`);
            console.log(`  Qty Billed  : ${d.qty_billed} (Should be present)`);
            const remaining = parseFloat(d.quantity) - parseFloat(d.qty_billed || 0);
            console.log(`  Remaining   : ${remaining}`);
        });

    } catch (error) {
        console.error('Fetch error:', error);
    }
}
run();
