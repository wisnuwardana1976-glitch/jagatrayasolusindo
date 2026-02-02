
const BASE_URL = 'http://localhost:3001/api';

async function run() {
    try {
        console.log('Fetching all conversions...');
        const res = await fetch(`${BASE_URL}/item-conversions`);
        const json = await res.json();

        if (!json.success) {
            console.error('Failed to fetch:', json.error);
            return;
        }

        const conversions = json.data;
        console.log(`Found ${conversions.length} conversions.`);

        let found = false;
        for (const conv of conversions) {
            console.log(`Checking Conv ID: ${conv.id}, Status: ${conv.status}, Date: ${conv.doc_date}`);
            // if (conv.status !== 'Posted') continue; // Check all statuses just in case

            // Fetch details
            const detailRes = await fetch(`${BASE_URL}/item-conversions/${conv.id}`);
            const detailJson = await detailRes.json();
            const details = detailJson.data.details;

            if (!details) {
                console.log('No details found for conv', conv.id);
                continue;
            }

            const relevant = details.filter(d => d.item_id === 6 || d.item_id === 7);
            if (relevant.length > 0) {
                console.log(`  -> Contains relevant items:`, relevant.map(d => ({ item: d.item_name, type: d.detail_type, qty: d.quantity, loc: d.location_code })));
                if (conv.status === 'Posted') found = true;
            }
        }

        if (!found) {
            console.log('No POSTED conversions found for Item 6 (Casing) or 7 (Harddisk).');
        } else {
            console.log('Found POSTED conversions. Stock should be present.');
        }

    } catch (e) {
        console.error(e);
    }
}

run();
