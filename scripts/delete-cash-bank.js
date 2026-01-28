
// import fetch from 'node-fetch'; // Native fetch used

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}/api`;

async function run() {
    try {
        console.log('Fetching transcodes...');
        const trRes = await fetch(`${BASE_URL}/transcodes`);
        const trData = await trRes.json();

        if (!trData.success) throw new Error('Failed to fetch transcodes');

        // IDs verified from previous run:
        // { id: 11, name: 'BCA Masuk' }, { id: 13, name: 'BCA Keluar' }
        // { id: 14, name: 'BNI Masuk' }, { id: 15, name: 'BNI Keluar' }
        // { id: 16, name: 'Cash Gudang masuk' }, { id: 17, name: 'Cash Gudang Keluar' }
        // { id: 10, name: 'Cash Masuk' }, { id: 12, name: 'Cash Keluar' }
        const targetIds = [10, 11, 12, 13, 14, 15, 16, 17];

        console.log('Target Transcode IDs:', targetIds);

        console.log('Fetching journals...');
        const jRes = await fetch(`${BASE_URL}/journals?source_type=MANUAL`);
        const jData = await jRes.json();

        if (!jData.success) throw new Error('Failed to fetch journals');

        const toDelete = jData.data.filter(j => targetIds.includes(j.transcode_id));

        console.log(`Found ${toDelete.length} transactions to delete.`);

        if (toDelete.length === 0) {
            console.log('Nothing to delete.');
            return;
        }

        for (const journal of toDelete) {
            console.log(`Deleting Journal ${journal.doc_number} (ID: ${journal.id})...`);
            try {
                const delRes = await fetch(`${BASE_URL}/journals/${journal.id}`, { method: 'DELETE' });
                const delData = await delRes.json();
                if (delData.success) {
                    console.log(`  -> Deleted.`);
                } else {
                    console.error(`  -> Failed: ${delData.error}`);
                }
            } catch (err) {
                console.error(`  -> Error: ${err.message}`);
            }
        }

        console.log('Done.');

    } catch (e) {
        console.error('Script Error:', e);
    }
}

run();
