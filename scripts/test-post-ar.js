import fetch from 'node-fetch';

async function testPost() {
    const payload = {
        doc_number: 'ARI/TEST/009',
        doc_date: '2026-01-26',
        due_date: '2026-01-26',
        partner_id: 3,
        shipment_id: '',
        total_amount: 4000000,
        status: 'Draft',
        notes: 'Test note',
        transcode_id: 8,
        tax_type: 'Exclude',
        sales_person_id: 1,
        payment_term_id: 1,
        items: [
            {
                item_id: 1,
                description: 'Test Item',
                quantity: 1,
                unit_price: 4000000,
                amount: 4000000
            }
        ]
    };

    try {
        const response = await fetch('http://localhost:3001/api/ar-invoices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));

    } catch (error) {
        console.error('Error:', error);
    }
}

testPost();
