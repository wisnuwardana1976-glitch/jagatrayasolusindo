
async function run() {
    try {
        console.log('Fetching AR Invoices...');
        const response = await fetch('http://localhost:3001/api/ar-invoices');
        const json = await response.json();

        if (!json.success) {
            console.error('API Error:', json.error);
            return;
        }

        console.log('--- AR Invoices List ---');
        const invoices = json.data;
        if (!invoices || invoices.length === 0) {
            console.log('No invoices found.');
            return;
        }

        // Show first 5
        invoices.slice(0, 5).forEach(inv => {
            console.log(`Dokumen: ${inv.doc_number}, Shipment: ${inv.shipment_number || 'N/A'}`);
        });

    } catch (error) {
        console.error('Fetch error:', error);
    }
}
run();
