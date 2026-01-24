import fetch from 'node-fetch';

async function testEntityApi() {
    const baseUrl = 'http://localhost:3001/api/entities';
    let entityId = null;

    try {
        console.log('🏁 Starting Entity API Test...');

        // 1. Create Entity
        console.log('\nTesting POST /api/entities...');
        const createRes = await fetch(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: 'ENT001',
                name: 'Test Entity',
                address: 'Jl. Test No. 1',
                phone: '08123456789',
                email: 'test@example.com',
                tax_id: '123.456.789',
                active: 'Y'
            })
        });
        const createData = await createRes.json();
        console.log('Create Response:', createData);

        if (createData.success) {
            entityId = createData.data.id;
            console.log('✅ Entity Created with ID:', entityId);
        } else {
            throw new Error('Failed to create entity');
        }

        // 2. Get All Entities
        console.log('\nTesting GET /api/entities...');
        const listRes = await fetch(baseUrl);
        const listData = await listRes.json();
        // console.log('List Response:', listData);
        if (listData.success && listData.data.length > 0) {
            console.log(`✅ Fetched ${listData.data.length} entities`);
        } else {
            console.log('❌ Failed to fetch list or empty');
        }

        // 3. Get Entity by ID
        console.log(`\nTesting GET /api/entities/${entityId}...`);
        const getRes = await fetch(`${baseUrl}/${entityId}`);
        const getData = await getRes.json();
        if (getData.success && getData.data) {
            console.log('✅ Fetched Entity:', getData.data.name);
        } else {
            console.log('❌ Failed to fetch entity by ID');
        }

        // 4. Update Entity
        console.log(`\nTesting PUT /api/entities/${entityId}...`);
        const updateRes = await fetch(`${baseUrl}/${entityId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: 'ENT001',
                name: 'Test Entity Updated',
                address: 'Jl. Test No. 1 Updated',
                phone: '08123456789',
                email: 'test@example.com',
                tax_id: '123.456.789',
                active: 'Y'
            })
        });
        const updateData = await updateRes.json();
        console.log('Update Response:', updateData);
        if (updateData.success) {
            console.log('✅ Entity Updated');
        } else {
            console.log('❌ Failed to update entity');
        }

        // 5. Delete Entity
        console.log(`\nTesting DELETE /api/entities/${entityId}...`);
        const deleteRes = await fetch(`${baseUrl}/${entityId}`, {
            method: 'DELETE'
        });
        const deleteData = await deleteRes.json();
        console.log('Delete Response:', deleteData);
        if (deleteData.success) {
            console.log('✅ Entity Deleted');
        } else {
            console.log('❌ Failed to delete entity');
        }

    } catch (error) {
        console.error('❌ Test Failed:', error);
    }
}

testEntityApi();
