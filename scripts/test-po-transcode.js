import fetch from 'node-fetch';

async function testCreateAndGetPO() {
    try {
        console.log('1. Creating new PO...');
        // First get a valid transcode ID for PO
        const transRes = await fetch('http://localhost:3001/api/transcodes');
        const transData = await transRes.json();
        const poTranscode = transData.data.find(t => t.nomortranscode === 1); // PO

        if (!poTranscode) {
            console.error('No PO Transcode found for testing');
            return;
        }

        const newPO = {
            doc_number: `TEST-PO-${Date.now()}`,
            doc_date: '2026-01-25',
            partner_id: 1, // Assumptions
            status: 'Draft',
            details: [],
            transcode_id: poTranscode.id
        };

        const createRes = await fetch('http://localhost:3001/api/purchase-orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPO)
        });
        const createResult = await createRes.json();
        console.log('Create Result:', createResult);

        if (createResult.success) {
            const poId = createResult.data.id;
            console.log(`2. Fetching PO details for ID ${poId}...`);
            const getRes = await fetch(`http://localhost:3001/api/purchase-orders/${poId}`);
            const getResult = await getRes.json();

            console.log('Fetched PO Data:', getResult.data);

            if (getResult.data.transcode_id == poTranscode.id) {
                console.log('✅ PASS: transcode_id is correctly saved and retrieved.');
            } else {
                console.log(`❌ FAIL: Expected transcode_id ${poTranscode.id}, got ${getResult.data.transcode_id}`);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

testCreateAndGetPO();
