// Script to test AP Invoice API response
import fetch from 'node-fetch';

async function testApi() {
    try {
        console.log('Fetching AP Invoices from API...');
        const response = await fetch('http://localhost:3001/api/ap-invoices');
        const data = await response.json();

        if (data.success) {
            console.log(`Found ${data.data.length} invoices.`);
            if (data.data.length > 0) {
                console.log('First invoice data:', JSON.stringify(data.data[0], null, 2));

                // Specific check for receiving fields
                console.log('\nChecking receiving fields for all invoices:');
                data.data.forEach(inv => {
                    console.log(`Doc: ${inv.doc_number}, RecID: ${inv.receiving_id}, RecNum: ${inv.receiving_number}`);
                });
            }
        } else {
            console.log('Error:', data.message);
        }
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testApi();
