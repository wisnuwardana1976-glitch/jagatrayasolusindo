
const BASE_URL = 'http://localhost:3001/api';

async function run() {
    try {
        console.log('--- Verify Receiving API ---');
        const res = await fetch(`${BASE_URL}/receivings`);
        const data = await res.json();

        if (data.success) {
            console.log(`API Success. Found ${data.data.length} receivings.`);
        } else {
            console.error(`API Failed: ${data.error}`);
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

run();
