import fetch from 'node-fetch';

async function testReport() {
    try {
        const response = await fetch('http://localhost:3001/api/reports/po-outstanding');
        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Body:', text);
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testReport();
