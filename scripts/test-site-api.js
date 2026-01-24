import fetch from 'node-fetch';

async function testSiteApi() {
    const baseUrl = 'http://localhost:3001/api/sites';
    let entityId = null;
    let siteId = null;

    try {
        console.log('🏁 Starting Site API Test...');

        // 0. Get an Entity ID (needed for Site)
        console.log('\nFetching Entity for dependency...');
        const entRes = await fetch('http://localhost:3001/api/entities');
        const entData = await entRes.json();
        if (entData.success && entData.data.length > 0) {
            entityId = entData.data[0].id;
            console.log('✅ Found Entity ID:', entityId);
        } else {
            console.log('⚠️ No Entity found, creating one...');
            const createEntRes = await fetch('http://localhost:3001/api/entities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: 'ENT-TEST',
                    name: 'Entity Test For Site',
                    active: 'Y'
                })
            });
            const createEntData = await createEntRes.json();
            if (createEntData.success) {
                entityId = createEntData.data.id;
                console.log('✅ Created Entity ID:', entityId);
            } else {
                throw new Error('Failed to create dependent Entity');
            }
        }

        // 1. Create Site
        console.log('\nTesting POST /api/sites...');
        const createRes = await fetch(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: 'SITE001',
                name: 'Test Site',
                entity_id: entityId,
                address: 'Jl. Site Test No. 1',
                phone: '021-1234567',
                active: 'Y'
            })
        });
        const createData = await createRes.json();
        console.log('Create Response:', createData);

        if (createData.success) {
            siteId = createData.data.id;
            console.log('✅ Site Created with ID:', siteId);
        } else {
            throw new Error('Failed to create site');
        }

        // 2. Get All Sites
        console.log('\nTesting GET /api/sites...');
        const listRes = await fetch(baseUrl);
        const listData = await listRes.json();
        if (listData.success && listData.data.length > 0) {
            console.log(`✅ Fetched ${listData.data.length} sites`);
        } else {
            console.log('❌ Failed to fetch list or empty');
        }

        // 3. Get Site by ID
        console.log(`\nTesting GET /api/sites/${siteId}...`);
        const getRes = await fetch(`${baseUrl}/${siteId}`);
        const getData = await getRes.json();
        if (getData.success && getData.data) {
            console.log('✅ Fetched Site:', getData.data.name);
        } else {
            console.log('❌ Failed to fetch site by ID');
        }

        // 4. Update Site
        console.log(`\nTesting PUT /api/sites/${siteId}...`);
        const updateRes = await fetch(`${baseUrl}/${siteId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: 'SITE001',
                name: 'Test Site Updated',
                entity_id: entityId,
                address: 'Jl. Site Test No. 1 Updated',
                phone: '021-1234567',
                active: 'Y'
            })
        });
        const updateData = await updateRes.json();
        console.log('Update Response:', updateData);
        if (updateData.success) {
            console.log('✅ Site Updated');
        } else {
            console.log('❌ Failed to update site');
        }

        // 5. Delete Site
        console.log(`\nTesting DELETE /api/sites/${siteId}...`);
        const deleteRes = await fetch(`${baseUrl}/${siteId}`, {
            method: 'DELETE'
        });
        const deleteData = await deleteRes.json();
        console.log('Delete Response:', deleteData);
        if (deleteData.success) {
            console.log('✅ Site Deleted');
        } else {
            console.log('❌ Failed to delete site');
        }

    } catch (error) {
        console.error('❌ Test Failed:', error);
    }
}

testSiteApi();
