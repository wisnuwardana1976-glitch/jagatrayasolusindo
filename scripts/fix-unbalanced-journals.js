// Script to fix incomplete journal details - fixed SQL
import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function fixIncompleteJournals() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await odbc.connect(connectionString);

        // Get all journals with their totals
        console.log('\n=== Checking all journals ===');
        const allJournals = await connection.query(`
            SELECT jv.id, jv.doc_number, jv.source_type, jv.ref_id
            FROM JournalVouchers jv
            ORDER BY jv.id
        `);

        // Get GL settings
        const invAcc = await connection.query("SELECT account_id FROM GeneralLedgerSettings WHERE setting_key = 'inventory_account'");
        const apAcc = await connection.query("SELECT account_id FROM GeneralLedgerSettings WHERE setting_key = 'ap_temp_account'");

        const inventoryAccountId = invAcc.length > 0 ? invAcc[0].account_id : null;
        const apTempAccountId = apAcc.length > 0 ? apAcc[0].account_id : null;

        console.log(`GL Settings: Inventory=${inventoryAccountId}, AP Temp=${apTempAccountId}`);

        for (const j of allJournals) {
            // Get details for this journal
            const details = await connection.query(
                'SELECT * FROM JournalVoucherDetails WHERE jv_id = ?',
                [j.id]
            );

            const totalDebit = details.reduce((sum, d) => sum + Number(d.debit || 0), 0);
            const totalCredit = details.reduce((sum, d) => sum + Number(d.credit || 0), 0);

            console.log(`\nJournal ID: ${j.id} (${j.doc_number})`);
            console.log(`  Details: ${details.length}, Debit: ${totalDebit}, Credit: ${totalCredit}`);

            if (totalDebit !== totalCredit) {
                console.log(`  ⚠️ UNBALANCED - Fixing...`);

                if (j.source_type === 'Receiving') {
                    const hasDebit = details.some(d => Number(d.debit) > 0);
                    const hasCredit = details.some(d => Number(d.credit) > 0);

                    if (hasDebit && !hasCredit && apTempAccountId) {
                        await connection.query(
                            'INSERT INTO JournalVoucherDetails (jv_id, coa_id, debit, credit, description) VALUES (?, ?, ?, ?, ?)',
                            [j.id, apTempAccountId, 0, totalDebit, 'AP Temporary']
                        );
                        console.log(`  ✓ Added Credit line: ${totalDebit} to COA ${apTempAccountId}`);
                    }

                    if (!hasDebit && hasCredit && inventoryAccountId) {
                        await connection.query(
                            'INSERT INTO JournalVoucherDetails (jv_id, coa_id, debit, credit, description) VALUES (?, ?, ?, ?, ?)',
                            [j.id, inventoryAccountId, totalCredit, 0, 'Inventory Receipt']
                        );
                        console.log(`  ✓ Added Debit line: ${totalCredit} to COA ${inventoryAccountId}`);
                    }
                }
            } else {
                console.log(`  ✓ Balanced`);
            }
        }

        // Final verification
        console.log('\n\n=== Final Verification ===');
        for (const j of allJournals) {
            const details = await connection.query(
                'SELECT * FROM JournalVoucherDetails WHERE jv_id = ?',
                [j.id]
            );
            const totalDebit = details.reduce((sum, d) => sum + Number(d.debit || 0), 0);
            const totalCredit = details.reduce((sum, d) => sum + Number(d.credit || 0), 0);
            const balanced = totalDebit === totalCredit ? '✓' : '✗';
            console.log(`${balanced} ID: ${j.id}, DocNum: ${j.doc_number}, Details: ${details.length}, Debit: ${totalDebit}, Credit: ${totalCredit}`);
        }

    } catch (error) {
        console.error('Error:', error.message);
        console.error(error);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

fixIncompleteJournals();
