
// import fetch from 'node-fetch';
// Using native fetch for safety as before

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}/api`;

async function run() {
    try {
        console.log('Fetching journals...');
        const res = await fetch(`${BASE_URL}/journals?source_type=MANUAL`);
        const data = await res.json();

        if (data.success && data.data.length > 0) {
            console.log('First 3 journals:');
            data.data.slice(0, 3).forEach(j => {
                console.log(`Doc: ${j.doc_number}`);
                console.log('Keys:', Object.keys(j));
                console.log(`Total Amount: ${j.total_amount}`);
            });
        } else {
            console.log('No journals found or success=false');
        }

    } catch (e) {
        console.error(e);
    }
}
run();
