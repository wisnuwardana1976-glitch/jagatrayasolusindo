// Script to debug journal details insert issue
import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function debugJournalDetails() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await odbc.connect(connectionString);

        // 1. Check JournalVouchers
        const jvs = await connection.query('SELECT * FROM JournalVouchers ORDER BY id DESC');
        console.log('\n=== JournalVouchers ===');
        jvs.forEach(jv => console.log(`ID: ${jv.id}, DocNum: ${jv.doc_number}, Source: ${jv.source_type}, RefID: ${jv.ref_id}`));

        // 2. Check JournalVoucherDetails
        const details = await connection.query('SELECT * FROM JournalVoucherDetails ORDER BY id DESC');
        console.log('\n=== JournalVoucherDetails ===');
        if (details.length === 0) {
            console.log('NO DETAILS FOUND!');
        } else {
            details.forEach(d => console.log(`ID: ${d.id}, JV_ID: ${d.jv_id}, COA: ${d.coa_id}, Debit: ${d.debit}, Credit: ${d.credit}`));
        }

        // 3. Try manual insert into JournalVoucherDetails with existing JV ID
        if (jvs.length > 0) {
            const testJvId = jvs[0].id;
            console.log(`\n=== Trying manual insert with JV ID: ${testJvId} ===`);
            try {
                await connection.query('BEGIN TRANSACTION');
                await connection.query(
                    'INSERT INTO JournalVoucherDetails (jv_id, coa_id, debit, credit, description) VALUES (?, ?, ?, ?, ?)',
                    [testJvId, 8, 100000, 0, 'Test Insert']
                );
                console.log('Insert SUCCESS!');

                // Rollback test insert
                await connection.query('ROLLBACK');
                console.log('Rolled back test insert.');
            } catch (e) {
                console.error('Insert FAILED:', e.message);
                console.error('Full Error:', e);
                await connection.query('ROLLBACK');
            }
        }

        // 4. Check Accounts table to verify COA ID 8 exists
        const accounts = await connection.query('SELECT id, code, name FROM Accounts WHERE id IN (8, 46)');
        console.log('\n=== Accounts Check ===');
        accounts.forEach(a => console.log(`ID: ${a.id}, Code: ${a.code}, Name: ${a.name}`));

    } catch (error) {
        console.error('Error:', error.message);
        console.error('Full Error:', error);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

debugJournalDetails();
