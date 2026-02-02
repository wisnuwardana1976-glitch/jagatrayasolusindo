
const BASE_URL = 'http://localhost:3001/api';

async function run() {
    try {
        console.log('--- Verification Script: Recalculate Stock for Harddisk & Casing ---');

        const warehouseId = 2; // Assuming Warehouse 2 based on previous checks
        const items = [
            { id: 7, name: 'Harddisk' },
            { id: 6, name: 'Casing' }
        ];

        for (const item of items) {
            console.log(`\nChecking Item: ${item.name} (ID: ${item.id})`);

            // 1. Check Initial Stock
            const initRes = await fetch(`${BASE_URL}/reports/stock-summary?warehouse_id=${warehouseId}&search=${item.name}`);
            const initData = await initRes.json();
            const initQty = initData.data[0]?.total_quantity || 0;
            console.log(`Current Stock: ${initQty}`);

            // 2. Run Recalculate
            console.log(`Running Recalculate...`);
            const recalcRes = await fetch(`${BASE_URL}/inventory/recalculate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ warehouse_id: warehouseId, item_id: item.id })
            });
            const recalcData = await recalcRes.json();
            if (!recalcData.success) {
                console.error(`Recalculate Failed: ${recalcData.error}`);
                continue;
            }

            console.log('Recalculation Success. Debug Info:', JSON.stringify(recalcData.debug, null, 2));

            // 3. Check Stock Again
            const finalRes = await fetch(`${BASE_URL}/reports/stock-summary?warehouse_id=${warehouseId}&search=${item.name}`);
            const finalData = await finalRes.json();
            const finalQty = finalData.data[0]?.total_quantity || 0;
            console.log(`New Stock: ${finalQty}`);

            if (finalQty > initQty) {
                console.log(`✅ Stock INCREASED! Fix passed. Logic now includes conversions.`);
            } else if (finalQty === initQty) {
                console.log(`⚠️ Stock UNCHANGED.`);
            } else {
                console.log(`❌ Stock DECREASED.`);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

run();
