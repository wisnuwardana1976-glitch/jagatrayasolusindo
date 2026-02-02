
const BASE_URL = 'http://localhost:3001/api';

async function run() {
    try {
        console.log('--- Reproduction Script: Missing Stock from Conversions ---');

        // 1. Setup Data
        const itemInput = 1; // Computer
        const itemOutput = 7; // Harddisk
        const locationId = 2; // L1-01 (Warehouse 2)
        const warehouseId = 2;

        // Get Initial Stock
        console.log('\n1. Checking Initial Stock...');
        const initStockRes = await fetch(`${BASE_URL}/reports/stock-summary?warehouse_id=${warehouseId}&search=Harddisk`);
        const initStockData = await initStockRes.json();
        const initQty = initStockData.data[0]?.total_quantity || 0;
        console.log(`Initial Harddisk Qty: ${initQty}`);

        // 2. Create Conversion
        console.log('\n2. Creating Item Conversion (Draft)...');
        const docNumber = `TEST-CONV-${Date.now()}`;
        const payload = {
            doc_number: docNumber,
            doc_date: new Date().toISOString().split('T')[0],
            notes: 'Reproduction Test',
            transcode_id: null,
            inputItems: [
                { item_id: itemInput, quantity: 1, unit_cost: 10000, amount: 10000, location_id: locationId }
            ],
            outputItems: [
                { item_id: itemOutput, quantity: 5, unit_cost: 2000, amount: 10000, location_id: locationId }
            ]
        };

        const createRes = await fetch(`${BASE_URL}/item-conversions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const createData = await createRes.json();
        if (!createData.success) throw new Error(`Create Failed: ${createData.error}`);
        const conversionId = createData.id;
        console.log(`Conversion Created. ID: ${conversionId}`);

        // 3. Post Conversion
        console.log('\n3. Posting Conversion...');
        const postRes = await fetch(`${BASE_URL}/item-conversions/${conversionId}/post`, {
            method: 'PUT'
        });
        const postData = await postRes.json();
        if (!postData.success) throw new Error(`Post Failed: ${postData.error}`);
        console.log('Conversion Posted.');

        // 4. Check Stock (Should be Init + 5)
        console.log('\n4. Checking Stock after Post...');
        const postStockRes = await fetch(`${BASE_URL}/reports/stock-summary?warehouse_id=${warehouseId}&search=Harddisk`);
        const postStockData = await postStockRes.json();
        const postQty = postStockData.data[0]?.total_quantity || 0;
        console.log(`Harddisk Qty after Post: ${postQty}`);

        if (postQty !== initQty + 5) {
            console.error('WARNING: Stock did not increase correctly after posting! Is the standard logic broken?');
        }

        // 5. Run Recalculate
        console.log('\n5. Running Recalculate Inventory...');
        // Note: Recalculate might take a moment if dataset is large, but for single item it should be fast.
        const recalcRes = await fetch(`${BASE_URL}/inventory/recalculate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ warehouse_id: warehouseId, item_id: itemOutput })
        });
        const recalcData = await recalcRes.json();
        if (!recalcData.success) throw new Error(`Recalculate Failed: ${recalcData.error}`);
        console.log('Recalculation Complete.');

        // 6. Check Stock Again (Should still be Init + 5)
        console.log('\n6. Checking Stock after Recalculate...');
        const finalStockRes = await fetch(`${BASE_URL}/reports/stock-summary?warehouse_id=${warehouseId}&search=Harddisk`);
        const finalStockData = await finalStockRes.json();
        const finalQty = finalStockData.data[0]?.total_quantity || 0;
        console.log(`Harddisk Qty after Recalculate: ${finalQty}`);

        if (finalQty < postQty) {
            console.log('\n❌ FAILURE CONFIRMED: Stock decreased after recalculation. Conversion was ignored.');
        } else {
            console.log('\n✅ SUCCESS: Stock preserved. Bug fixed or not reproduced.');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

run();
