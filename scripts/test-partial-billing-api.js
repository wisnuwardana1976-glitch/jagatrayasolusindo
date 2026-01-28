
// Native fetch
async function run() {
    try {
        const recId = 11; // RCV/012026/0026
        console.log(`Fetching Receiving ID: ${recId}`);
        const response = await fetch(`http://localhost:3001/api/receivings/${recId}`);
        const json = await response.json();

        if (!json.success) {
            console.error('API Error:', json.error);
            return;
        }

        console.log('--- Receiving Details Inspection ---');
        const details = json.data.details;
        if (!details || details.length === 0) {
            console.log('No details found.');
            return;
        }

        details.forEach((d, idx) => {
            console.log(`Item #${idx + 1}: ${d.item_name} (ID: ${d.item_id})`);
            console.log(`  Qty Received: ${d.quantity}`);
            console.log(`  Qty Billed  : ${d.qty_billed} (Should be present)`);
            const remaining = parseFloat(d.quantity) - parseFloat(d.qty_billed || 0);
            console.log(`  Remaining   : ${remaining}`);
        });

    } catch (error) {
        console.error('Fetch error:', error);
    }
}
run();
