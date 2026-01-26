import fetch from 'node-fetch';

async function testApi() {
    try {
        const response = await fetch('http://localhost:3001/api/shipments/15');
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

testApi();
