
// Use native fetch (Node 18+)
async function run() {
    try {
        // 1. Fetch all POs (baseline)
        console.log('Fetching ALL POs...');
        const resAll = await fetch('http://localhost:3001/api/purchase-orders');
        const jsonAll = await resAll.json();
        const countAll = jsonAll.data ? jsonAll.data.length : 0;
        console.log(`Total POs: ${countAll}`);

        if (countAll > 0) {
            console.log('Sample dates:', jsonAll.data.slice(0, 3).map(p => p.doc_date));
        }

        // 2. Fetch Filtered POs (e.g., Jan 2026)
        // Adjust these dates to match data you actually have
        const start = '2026-01-01';
        const end = '2026-01-31';
        console.log(`\nFetching POs between ${start} and ${end}...`);

        const url = `http://localhost:3001/api/purchase-orders?startDate=${start}&endDate=${end}`;
        const resFilter = await fetch(url);
        const jsonFilter = await resFilter.json();
        const countFilter = jsonFilter.data ? jsonFilter.data.length : 0;

        console.log(`Filtered POs: ${countFilter}`);
        if (countFilter > 0) {
            jsonFilter.data.forEach(p => {
                console.log(`  - ${p.doc_number}: ${p.doc_date}`);
            });
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

run();
