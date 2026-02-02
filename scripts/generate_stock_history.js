
const BASE_URL = 'http://localhost:3001/api';

async function run() {
    try {
        const period = process.argv[2]; // YYYY-MM
        if (!period) throw new Error('Usage: node scripts/generate_stock_history.js YYYY-MM [item_id]');
        const itemId = process.argv[3] ? parseInt(process.argv[3]) : null;

        console.log(`Triggering History Generation for ${period}...`);

        const payload = { period };
        if (itemId) payload.item_id = itemId;

        const res = await fetch(`${BASE_URL}/inventory/history-generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.success) {
            console.log('Success:', data.message);
        } else {
            console.error('Failed:', data.error);
        }

    } catch (e) {
        console.error('Error:', e.message);
    }
}

run();
