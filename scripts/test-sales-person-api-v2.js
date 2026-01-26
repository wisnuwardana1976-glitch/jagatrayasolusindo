import fetch from 'node-fetch';

async function testApi() {
    try {
        const response = await fetch('http://localhost:3001/api/salespersons');
        console.log('Status:', response.status);
        if (response.ok) {
            const data = await response.json();
            console.log('Success:', data.success);
            console.log('Count:', data.data ? data.data.length : 0);
        } else {
            console.log('Error:', response.statusText);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

testApi();
