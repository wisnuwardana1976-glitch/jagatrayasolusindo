import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function main() {
    let connection;
    try {
        const id = 1;
        console.log('Attempting to post AP Adjustment ID:', id);
        connection = await odbc.connect(connectionString);

        // Reset status to Approved if it was already Posted or something else to allow retry
        // await connection.query("UPDATE APAdjustments SET status = 'Approved' WHERE id = ?", [id]);

        const adjResult = await connection.query('SELECT * FROM APAdjustments WHERE id = ?', [id]);
        const adj = adjResult[0];

        if (!adj) {
            console.log('Adjustment not found');
            return;
        }
        console.log('Adjustment data:', adj);

        // Get AP account
        let apAccountId = adj.counter_account_id;
        try {
            const apAccount = await connection.query("SELECT id FROM Accounts WHERE type = 'LIABILITY' AND (name LIKE '%Hutang%' OR name LIKE '%Payable%')");
            if (apAccount.length > 0) apAccountId = apAccount[0].id;
            console.log('Found AP Account ID:', apAccountId);
        } catch (e) {
            console.log('Error searching AP account:', e.message);
        }

        // Create Journal Voucher
        const jvNumber = `JV-APADJ-${adj.doc_number}`;
        console.log('Target JV Number:', jvNumber);

        let jvId;
        try {
            // Check if JV already exists
            const existingJV = await connection.query("SELECT id FROM JournalVouchers WHERE doc_number = ?", [jvNumber]);

            if (existingJV.length > 0) {
                jvId = existingJV[0].id;
                console.log('JV already exists, using existing JV ID:', jvId);
                await connection.query('DELETE FROM JournalVoucherDetails WHERE jv_id = ?', [jvId]);
                await connection.query("UPDATE JournalVouchers SET doc_date = ?, description = ?, status = 'Posted', source_type = 'AP_ADJUSTMENT', ref_id = ? WHERE id = ?",
                    [adj.doc_date, `AP Adjustment ${adj.type}: ${adj.doc_number}`, adj.id, jvId]);
            } else {
                console.log('Creating new JV...');
                await connection.query(`
                INSERT INTO JournalVouchers (doc_number, doc_date, description, status, source_type, ref_id, is_giro)
                VALUES (?, ?, ?, 'Posted', 'AP_ADJUSTMENT', ?, 0)
              `, [jvNumber, adj.doc_date, `AP Adjustment ${adj.type}: ${adj.doc_number}`, adj.id]);

                const jvResult = await connection.query('SELECT @@IDENTITY as id');
                jvId = Number(jvResult[0].id);
                console.log('Created JV ID:', jvId);
            }

            // Journal entries
            if (adj.type === 'DEBIT') {
                console.log('Inserting Debit entry...');
                await connection.query('INSERT INTO JournalVoucherDetails (jv_id, coa_id, description, debit, credit) VALUES (?, ?, ?, ?, 0)',
                    [jvId, apAccountId, 'Pengurangan Hutang', adj.total_amount]);
                console.log('Inserting Credit entry...');
                await connection.query('INSERT INTO JournalVoucherDetails (jv_id, coa_id, description, debit, credit) VALUES (?, ?, ?, 0, ?)',
                    [jvId, adj.counter_account_id, 'Contra AP Debit Adj', adj.total_amount]);
            } else {
                console.log('Inserting Debit entry...');
                await connection.query('INSERT INTO JournalVoucherDetails (jv_id, coa_id, description, debit, credit) VALUES (?, ?, ?, ?, 0)',
                    [jvId, adj.counter_account_id, 'Contra AP Credit Adj', adj.total_amount]);
                console.log('Inserting Credit entry...');
                await connection.query('INSERT INTO JournalVoucherDetails (jv_id, coa_id, description, debit, credit) VALUES (?, ?, ?, 0, ?)',
                    [jvId, apAccountId, 'Penambahan Hutang', adj.total_amount]);
            }

            // Update status
            console.log('Updating adjustment status...');
            await connection.query(`UPDATE APAdjustments SET status = 'Posted', updated_at = CURRENT TIMESTAMP WHERE id = ?`, [id]);

            console.log('SUCCESS! Adjustment posted.');
        } catch (innerError) {
            console.error('SQL Error during posting:', innerError.message);
            if (innerError.odbcErrors) {
                console.error('ODBC Errors:', JSON.stringify(innerError.odbcErrors, null, 2));
            }
        }

    } catch (error) {
        console.error('Connection Error:', error.message);
    } finally {
        if (connection) await connection.close();
    }
}

main();
