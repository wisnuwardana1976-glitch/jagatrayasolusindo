import fetch from 'node-fetch';

async function testRecalculate() {
    try {
        console.log('Triggering Recalculate...');
        const response = await fetch('http://localhost:3005/api/inventory/recalculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}) // Recalculate all
        });
        const data = await response.json();
        console.log('Response:', data);
    } catch (e) {
        console.error('Error:', e);
    }
}

testRecalculate();
