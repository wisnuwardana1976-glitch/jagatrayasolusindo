
import dotenv from 'dotenv';
import odbc from 'odbc';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;
const API_URL = `http://localhost:${process.env.PORT || 3001}/api`;

async function runTest() {
    let connection;
    try {
        console.log('Connecting to DB...');
        connection = await odbc.connect(connectionString);

        // 1. Get Transcode ID
        console.log('Fetching Transcodes...');
        const trRes = await fetch(`${API_URL}/transcodes`);
        const trData = await trRes.json();
        const transcode = trData.data.find(t => t.nomortranscode === 10); // Cash Masuk

        if (!transcode) {
            console.error('Transcode Cash Masuk (10) not found!');
            return;
        }
        console.log(`Using Transcode: ${transcode.code} (ID: ${transcode.id})`);

        // 2. Create Journal Payload
        const payload = {
            doc_number: 'TEST-GP-' + Date.now(),
            doc_date: new Date().toISOString().split('T')[0],
            description: 'API Casting Test',
            transcode_id: transcode.id,
            is_giro: true,
            giro_number: 'GR-CAST',
            giro_due_date: '2025-12-31',
            giro_bank_name: 'BCA Test',
            details: []
        };

        // Fetch Accounts
        const accRes = await fetch(`${API_URL}/accounts`);
        const accData = await accRes.json();
        const cashAcc = accData.data.find(a => a.name.toLowerCase().includes('kas'));
        const otherAcc = accData.data.find(a => a.id !== cashAcc?.id);

        if (!cashAcc || !otherAcc) {
            console.error('Need at least 2 accounts to test journal');
            return;
        }

        payload.details = [
            { coa_id: otherAcc.id, description: 'Revenue', credit: 10000, debit: 0 },
            { coa_id: cashAcc.id, description: 'Cash', credit: 0, debit: 10000 }
        ];

        // 3. Call API
        console.log('Sending POST /api/journals...');
        const postRes = await fetch(`${API_URL}/journals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const postData = await postRes.json();

        if (!postData.success) {
            console.error('API Error:', postData.error);
            return;
        }

        console.log('Journal Created via API. ID:', postData.id);

        // 4. Verify in DB
        const jvId = postData.id;
        const result = await connection.query(`SELECT is_giro, giro_number, giro_due_date, giro_bank_name FROM JournalVouchers WHERE id = ?`, [jvId]);

        console.log('--- DB Verification ---');
        console.log('Result:', result[0]);

        if (result[0].is_giro && result[0].giro_number === 'GR-CAST' && result[0].giro_bank_name === 'BCA Test') {
            console.log('TEST PASSED: Giro data (including Bank Name) saved correctly via API.');
        } else {
            console.error('TEST FAILED: Giro data mismatch.');
        }

        // Cleanup
        console.log('Cleaning up...');
        await fetch(`${API_URL}/journals/${jvId}`, { method: 'DELETE' });
        console.log('Test Journal Deleted.');

    } catch (e) {
        console.error('Test Error:', e);
    } finally {
        if (connection) await connection.close();
    }
}

runTest();
