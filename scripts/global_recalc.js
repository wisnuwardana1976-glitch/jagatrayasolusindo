
const BASE_URL = 'http://localhost:3001/api';

async function run() {
    try {
        console.log('--- Triggering GLOBAL Stock Recalculation ---');
        const res = await fetch(`${BASE_URL}/inventory/recalculate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ item_id: null, warehouse_id: null })
        });

        const data = await res.json();
        if (data.success) {
            console.log('Global Recalculate SUCCESS.');
        } else {
            console.error('Global Recalculate FAILED:', data.error);
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

run();
