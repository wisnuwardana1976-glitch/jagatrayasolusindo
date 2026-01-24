import fetch from 'node-fetch';

async function testUpdate() {
    try {
        // Try to update ID 1 (Purchase Order) with nomortranscode 1
        console.log('Updating ID 1...');
        const response = await fetch('http://localhost:3001/api/transcodes/1', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: 'PO',
                name: 'Purchase Order',
                prefix: 'PO',
                format: '{PREFIX}/{MM}{YYYY}/{SEQ}',
                description: 'Kode transaksi pembelian',
                active: 'Y',
                nomortranscode: 1
            })
        });

        const data = await response.json();
        console.log('Update response:', data);

        // Verify update
        const check = await fetch('http://localhost:3001/api/transcodes/1');
        const checkData = await check.json();
        console.log('Verified data:', checkData.data);

    } catch (error) {
        console.error('Error:', error);
    }
}

testUpdate();
