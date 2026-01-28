
setTimeout(async () => {
    try {
        console.log('Verifying journals list...');
        const res = await fetch('http://localhost:3001/api/journals?source_type=MANUAL');
        const data = await res.json();
        console.log(`Initial count: ${data.data?.length}`);
        if (data.data && data.data.length > 0) {
            console.log('Top item:', data.data[0]);
        }
    } catch (e) {
        console.error('Fetch error:', e.message);
    }
}, 5000); // Wait 5s for server
