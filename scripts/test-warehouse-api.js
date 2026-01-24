import fetch from 'node-fetch';

async function testWarehouseApi() {
    const baseUrl = 'http://localhost:3001/api';
    let entityId = null;
    let siteId = null;
    let warehouseId = null;
    let subWarehouseId = null;
    let locationId = null;

    try {
        console.log('🏁 Starting Warehouse Hierarchy API Test...');

        // 0. Setup Dependencies (Entity & Site)
        console.log('\n--- Setup Dependencies ---');

        // Find or Create Entity
        const entRes = await fetch(`${baseUrl}/entities`);
        const entData = await entRes.json();
        if (entData.success && entData.data.length > 0) {
            entityId = entData.data[0].id;
        } else {
            const createEnt = await fetch(`${baseUrl}/entities`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: 'ENT-WH', name: 'Entity for Warehouse', active: 'Y' })
            });
            const d = await createEnt.json();
            entityId = d.data.id;
        }
        console.log('✅ Entity ID:', entityId);

        // Find or Create Site
        const siteRes = await fetch(`${baseUrl}/sites`);
        const siteData = await siteRes.json();
        if (siteData.success && siteData.data.length > 0) {
            siteId = siteData.data[0].id;
        } else {
            const createSite = await fetch(`${baseUrl}/sites`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: 'SITE-WH', name: 'Site for Warehouse', entity_id: entityId, active: 'Y' })
            });
            const d = await createSite.json();
            siteId = d.data.id;
        }
        console.log('✅ Site ID:', siteId);

        // 1. Test Warehouse
        console.log('\n--- Testing Warehouse ---');
        const whRes = await fetch(`${baseUrl}/warehouses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: 'WH001', name: 'Main Warehouse', site_id: siteId, active: 'Y' })
        });
        const whData = await whRes.json();
        if (whData.success) {
            warehouseId = whData.data.id;
            console.log('✅ Warehouse Created:', warehouseId);
        } else {
            console.error('❌ Failed create Warehouse:', whData.error);
        }

        // 2. Test Sub Warehouse
        console.log('\n--- Testing Sub Warehouse ---');
        const swRes = await fetch(`${baseUrl}/sub-warehouses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: 'SW001', name: 'Floor 1', warehouse_id: warehouseId, active: 'Y' })
        });
        const swData = await swRes.json();
        if (swData.success) {
            subWarehouseId = swData.data.id;
            console.log('✅ Sub Warehouse Created:', subWarehouseId);
        } else {
            console.error('❌ Failed create Sub Warehouse:', swData.error);
        }

        // 3. Test Location
        console.log('\n--- Testing Location ---');
        const locRes = await fetch(`${baseUrl}/locations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: 'LOC-A1', name: 'Rack A1', sub_warehouse_id: subWarehouseId, active: 'Y' })
        });
        const locData = await locRes.json();
        if (locData.success) {
            locationId = locData.data.id;
            console.log('✅ Location Created:', locationId);
        } else {
            console.error('❌ Failed create Location:', locData.error);
        }

        // 4. Verify Reads
        console.log('\n--- Verifying Reads ---');
        const readLoc = await fetch(`${baseUrl}/locations/${locationId}`);
        const readLocData = await readLoc.json();
        if (readLocData.success && readLocData.data) {
            console.log(`✅ Verified Location: ${readLocData.data.name} (Code: ${readLocData.data.code})`);
        } else {
            console.error('❌ Failed read Location');
        }

        // 5. Cleanup (Delete in reverse order)
        console.log('\n--- Cleanup ---');
        await fetch(`${baseUrl}/locations/${locationId}`, { method: 'DELETE' });
        console.log('✅ Location Deleted');
        await fetch(`${baseUrl}/sub-warehouses/${subWarehouseId}`, { method: 'DELETE' });
        console.log('✅ Sub Warehouse Deleted');
        await fetch(`${baseUrl}/warehouses/${warehouseId}`, { method: 'DELETE' });
        console.log('✅ Warehouse Deleted');

    } catch (error) {
        console.error('❌ Test Failed:', error);
    }
}

testWarehouseApi();
