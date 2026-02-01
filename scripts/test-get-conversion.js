
import fetch from 'node-fetch';

async function testGet() {
    try {
        const response = await fetch('http://localhost:3001/api/item-conversions/3');
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}

testGet();
