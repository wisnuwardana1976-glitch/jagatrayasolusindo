
const BASE_URL = 'http://localhost:3001/api';

async function run() {
    try {
        console.log('--- Creating Disassembly Conversion (Stock IN) ---');

        // Item 7 (Harddisk) -> OUTPUT (Qty 5)
        // Item 1 (Computer) -> INPUT (Qty 1)

        // Create Draft
        const docNumber = `TEST-DIS-${Date.now()}`;
        const payload = {
            doc_number: docNumber,
            doc_date: new Date().toISOString().split('T')[0],
            notes: 'Testing Stock Increase',
            transcode_id: null,
            inputItems: [
                { item_id: 1, quantity: 1, unit_cost: 5000000, amount: 5000000, location_id: 2 }
            ],
            outputItems: [
                { item_id: 7, quantity: 5, unit_cost: 1000000, amount: 5000000, location_id: 2 }
            ]
        };

        console.log('Creating Draft...');
        const createRes = await fetch(`${BASE_URL}/item-conversions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const createJson = await createRes.json();
        if (!createJson.success) throw new Error(createJson.error);

        const id = createJson.id;
        console.log(`Draft Created. ID: ${id}`);

        // Post
        console.log('Posting...');
        const postRes = await fetch(`${BASE_URL}/item-conversions/${id}/post`, {
            method: 'PUT'
        });
        const postJson = await postRes.json();
        if (!postJson.success) {
            console.error('Post Failed:', postJson.error);
            // If debug info available
            if (postJson.debug) console.log('Debug:', postJson.debug);
        } else {
            console.log('Post Success!');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

run();
