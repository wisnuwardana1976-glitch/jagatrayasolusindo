
async function verifyShipment() {
    console.log('Verifying Shipment API...');
    const url = 'http://localhost:3001/api/shipments?startDate=2026-01-01&endDate=2026-01-31';
    console.log('Fetching:', url);

    try {
        const response = await fetch(url);
        console.log('HTTP Status:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('Success:', data.success);
            console.log('Data Count:', data.data ? data.data.length : 0);
            if (data.data && data.data.length > 0) {
                console.log('First Shipment:', JSON.stringify(data.data[0], null, 2));
            }
        } else {
            console.log('Error Body:', await response.text());
        }
    } catch (e) {
        console.log('Connection Failed:', e.message);
    }
}
verifyShipment();
