
// Use native fetch (Node 18+)
async function run() {
    try {
        // Test February (Should be empty or different from Jan)
        const start = '2026-02-01';
        const end = '2026-02-28';
        console.log(`\nFetching POs between ${start} and ${end}...`);

        const url = `http://localhost:3001/api/purchase-orders?startDate=${start}&endDate=${end}`;
        console.log("Fetching URL:", url);
        const resFilter = await fetch(url);
        const jsonFilter = await resFilter.json();
        const countFilter = jsonFilter.data ? jsonFilter.data.length : 0;

        console.log(`Filtered POs count: ${countFilter}`);
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
