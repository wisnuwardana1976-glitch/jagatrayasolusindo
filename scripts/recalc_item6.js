
const BASE_URL = 'http://localhost:3001/api';
const item_id = 6; // Cas001
const warehouse_id = null;

async function run() {
    try {
        console.log('--- Recalculate Stock for Cas001 ---');
        console.log('Running Recalculate...');

        const res = await fetch(`${BASE_URL}/inventory/recalculate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ item_id, warehouse_id })
        });

        const data = await res.json();
        if (data.success) {
            console.log('Recalculation Success.');
            console.log('Debug transactions:', JSON.stringify(data.debug, null, 2));
        } else {
            console.error('Recalculation Failed:', data.error);
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

run();
