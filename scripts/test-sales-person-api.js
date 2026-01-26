import fetch from 'node-fetch';

async function testApi() {
    try {
        const response = await fetch('http://localhost:3001/api/sales-persons');
        console.log('Status:', response.status);
        if (response.ok) {
            const data = await response.json();
            console.log(JSON.stringify(data, null, 2));
        } else {
            console.log('Error:', response.statusText);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

testApi();
