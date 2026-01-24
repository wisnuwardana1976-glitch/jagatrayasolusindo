import fetch from 'node-fetch';

async function testWarehouseModifiedApi() {
    const baseUrl = 'http://localhost:3001/api';
    let entityId = null;
    let siteId = null;
    let warehouseId = null;

    try {
        console.log('🏁 Starting Warehouse Modified API Test...');

        // 0. Setup Dependencies
        console.log('\n--- Setup Dependencies ---');
        const entRes = await fetch(`${baseUrl}/entities`);
        const entData = await entRes.json();
        if (entData.success && entData.data.length > 0) entityId = entData.data[0].id;

        const siteRes = await fetch(`${baseUrl}/sites`);
        const siteData = await siteRes.json();
        if (siteData.success && siteData.data.length > 0) siteId = siteData.data[0].id;

        console.log('Dependencies:', { entityId, siteId });
        if (!siteId) throw new Error('Need at least one Site to test Warehouse');

        // 1. Test Create Warehouse (with description)
        console.log('\n--- Testing Warehouse Create (with description) ---');
        const whRes = await fetch(`${baseUrl}/warehouses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: 'WH-DESC',
                description: 'This is a description, NOT name',
                site_id: siteId,
                active: 'Y'
            })
        });
        const whData = await whRes.json();
        console.log('Create Result:', whData);

        if (whData.success) {
            warehouseId = whData.data.id;
            console.log('✅ Warehouse Created:', warehouseId);
            if (whData.data.description === 'This is a description, NOT name') {
                console.log('✅ Description field verified correctly');
            } else {
                console.error('❌ Description field mismatch');
            }
        } else {
            console.error('❌ Failed create Warehouse:', whData.error);
        }

        // 2. Test Read Warehouse
        console.log('\n--- Testing Warehouse Read ---');
        const readRes = await fetch(`${baseUrl}/warehouses/${warehouseId}`);
        const readData = await readRes.json();
        if (readData.success) {
            console.log('✅ Read Warehouse:', readData.data.description);
        }

        // 3. Cleanup
        console.log('\n--- Cleanup ---');
        await fetch(`${baseUrl}/warehouses/${warehouseId}`, { method: 'DELETE' });
        console.log('✅ Warehouse Deleted');

    } catch (error) {
        console.error('❌ Test Failed:', error);
    }
}

testWarehouseModifiedApi();
