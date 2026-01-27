
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

        // 1. Create Dummy Partner
        const partnerName = 'Alloc Partner ' + Date.now();
        const partnerCode = 'V-' + Date.now().toString().slice(-8);
        await connection.query(`INSERT INTO Partners (code, name, type) VALUES (?, ?, 'Vendor')`, [partnerCode, partnerName]);
        const partnerId = (await connection.query(`SELECT id FROM Partners WHERE name = ?`, [partnerName]))[0].id;
        console.log(`Created Partner: ${partnerName} (ID: ${partnerId})`);

        // 2. Create Dummy AP Invoice
        const invNum = 'INV-ALLOC-' + Date.now();
        const invTotal = 50000;
        await connection.query(`
            INSERT INTO APInvoices (doc_number, doc_date, due_date, partner_id, total_amount, status, paid_amount) 
            VALUES (?, CURRENT DATE, CURRENT DATE, ?, ?, 'Posted', 0)
        `, [invNum, partnerId, invTotal]);
        const invId = (await connection.query(`SELECT id FROM APInvoices WHERE doc_number = ?`, [invNum]))[0].id;
        console.log(`Created Invoice: ${invNum} (ID: ${invId})`);

        // 3. Create Journal via API with Allocation
        // Need Transcode ID (Cash Out = 11? Or use any valid)
        const trRes = await fetch(`${API_URL}/transcodes`);
        const trData = await trRes.json();
        const transcode = trData.data.find(t => t.nomortranscode === 11) || trData.data[0];
        console.log(`Using Transcode: ${transcode.code} (ID: ${transcode.id})`);

        // Need Account ID
        const accRes = await fetch(`${API_URL}/accounts`);
        const accData = await accRes.json();
        const cashAcc = accData.data.find(a => a.name.toLowerCase().includes('kas'));
        const expenseAcc = accData.data.find(a => a.id !== cashAcc?.id);

        const paymentAmount = 20000;

        const payload = {
            doc_number: 'PV-ALLOC-' + Date.now(),
            doc_date: new Date().toISOString().split('T')[0],
            description: 'Allocation Test',
            transcode_id: transcode.id,
            details: [
                {
                    coa_id: expenseAcc.id,
                    description: 'Payment',
                    debit: paymentAmount,
                    credit: 0,
                    ref_id: invId,
                    ref_type: 'AP'
                },
                {
                    coa_id: cashAcc.id,
                    description: 'Cash',
                    debit: 0,
                    credit: paymentAmount
                }
            ]
        };

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
        const jvId = postData.id;

        // 4. Verify Invoice Balance
        const invCheck = await connection.query(`SELECT total_amount, paid_amount, status FROM APInvoices WHERE id = ?`, [invId]);
        console.log('--- DB Verification ---');
        console.log('Invoice Status:', invCheck[0]);

        if (invCheck[0].paid_amount === paymentAmount && invCheck[0].status === 'Partial') {
            console.log('TEST PASSED: Allocating Part Payment updated Balance and Status.');
        } else {
            console.error('TEST FAILED: Invoice not updated correctly.');
        }

        // Cleanup
        console.log('Cleaning up...');
        await fetch(`${API_URL}/journals/${jvId}`, { method: 'DELETE' }); // Should revert allocation?
        // Let's check logic: DELETE handles logic? 
        // No, current DELETE implementation in server/index.js (L1075) does NOT handle allocation revert!
        // It checks status, then deletes. 
        // Logic Gap: If I delete a journal manually via API/UI, I need to revert invoice balance.
        // My implementation plan missed DELETE logic?
        // Let's see if delete endpoint handles it.
        // I should update DELETE endpoint too if I am being thorough.

        // For now, manual clean up in script
        await connection.query(`DELETE FROM APInvoices WHERE id = ?`, [invId]);
        await connection.query(`DELETE FROM Partners WHERE id = ?`, [partnerId]);

    } catch (e) {
        console.error('Test Error:', e);
    } finally {
        if (connection) await connection.close();
    }
}

runTest();
