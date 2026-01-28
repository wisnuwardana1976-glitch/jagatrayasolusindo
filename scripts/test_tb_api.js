
async function checkReport() {
    try {
        const response = await fetch('http://localhost:3001/api/reports/trial-balance?endDate=2026-01-31');
        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Response:', text);
    } catch (e) {
        console.error(e);
    }
}
checkReport();
