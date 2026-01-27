import fetch from 'node-fetch'; // Ensure node-fetch is available

const BASE_URL = 'http://localhost:3001/api';

async function runTest() {
    try {
        console.log('🔗 Connecting to API...');

        // 1. Create SO
        console.log('\n--- Step 1: Create SO ---');
        const soPayload = {
            doc_number: 'SO/TEST/UNAPPROVE/001',
            doc_date: '2026-01-27',
            partner_id: 1, // Assumes Partner 1 exists
            salesperson_id: 1, // Assumes SalesPerson 1 exists
            status: 'Approved', // Start as Approved
            items: [{ item_id: 1, quantity: 10, unit_price: 1000 }] // Assumes Item 1 exists
        };

        let res = await fetch(`${BASE_URL}/sales-orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(soPayload)
        });
        let data = await res.json();
        console.log('Create SO Response:', data);
        if (!data.success) throw new Error('Failed to create SO');
        const soId = data.data.id;
        console.log('✅ SO Created ID:', soId);

        // 2. Create Shipment (Draft -> Approved)
        console.log('\n--- Step 2: Create Shipment ---');
        const shPayload = {
            doc_number: 'SH/TEST/UNAPPROVE/001',
            doc_date: '2026-01-27',
            so_id: soId,
            partner_id: 1,
            status: 'Approved',
            items: [{ item_id: 1, quantity: 10, remarks: 'Test' }]
        };
        res = await fetch(`${BASE_URL}/shipments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(shPayload)
        });
        data = await res.json();
        console.log('Create Shipment Response:', data);
        if (!data.success) throw new Error('Failed to create Shipment');
        const shId = data.data.id;
        console.log('✅ Shipment Created ID:', shId);

        // Check SO Status (Should be Closed because fully shipped)
        res = await fetch(`${BASE_URL}/sales-orders/${soId}`);
        data = await res.json();
        console.log('SO Status after Shipment:', data.data.status);
        if (data.data.status !== 'Closed') console.warn('⚠️ SO Status is not Closed, logic might differ.');

        // 3. Try to Unapprove SO (Should Fail)
        console.log('\n--- Step 3: Try to Unapprove SO (Expect Failure) ---');
        res = await fetch(`${BASE_URL}/sales-orders/${soId}/unapprove`, { method: 'PUT' });
        data = await res.json(); // Don't check status code only, check body
        console.log('Unapprove Response:', data);
        if (data.success) {
            console.error('❌ Failed: SO Unapproved successfully but should have been blocked!');
        } else {
            console.log('✅ Correctly Blocked:', data.message);
        }

        // 4. Delete Shipment
        console.log('\n--- Step 4: Delete Shipment ---');
        res = await fetch(`${BASE_URL}/shipments/${shId}`, { method: 'DELETE' });
        data = await res.json();
        console.log('Delete Shipment Response:', data);

        // Wait for async update? No, should be awaited in backend.

        // Check SO Status (Should be Approved)
        res = await fetch(`${BASE_URL}/sales-orders/${soId}`);
        data = await res.json();
        console.log('SO Status after Shipment Delete:', data.data.status);

        // 5. Try to Unapprove SO (Should Succeed)
        console.log('\n--- Step 5: Try to Unapprove SO (Expect Success) ---');
        res = await fetch(`${BASE_URL}/sales-orders/${soId}/unapprove`, { method: 'PUT' });
        data = await res.json();
        console.log('Unapprove Response:', data);
        if (data.success) {
            console.log('✅ SO Unapproval Successful!');
        } else {
            console.error('❌ Failed to Unapprove SO:', data.error);
        }

        // Cleanup
        console.log('\n--- Cleanup ---');
        await fetch(`${BASE_URL}/sales-orders/${soId}`, { method: 'DELETE' });
        console.log('Test SO Deleted');

    } catch (error) {
        console.error('❌ Test Error:', error);
    }
}

runTest();
