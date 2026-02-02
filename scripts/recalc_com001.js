
const BASE_URL = 'http://localhost:3001/api';

async function run() {
    try {
        console.log('--- Recalculate Stock for COM001 ---');

        const warehouseId = 2;
        const itemId = 1; // COM001

        console.log(`Running Recalculate...`);
        const recalcRes = await fetch(`${BASE_URL}/inventory/recalculate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ warehouse_id: warehouseId, item_id: itemId })
        });
        const recalcData = await recalcRes.json();
        if (!recalcData.success) {
            console.error(`Recalculate Failed: ${recalcData.error}`);
            return;
        }

        console.log('Recalculation Success.');
        if (recalcData.debug) {
            console.log('Debug transactions:', JSON.stringify(recalcData.debug, null, 2));
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

run();
