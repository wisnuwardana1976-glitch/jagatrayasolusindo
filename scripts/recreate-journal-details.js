// Script to check journal status and recreate if needed
import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function checkAndRecreateJournals() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await odbc.connect(connectionString);

        // Step 1: Check all journals and their details
        console.log('\n=== All Journals with Details Count ===');
        const journals = await connection.query(`
            SELECT jv.id, jv.doc_number, jv.source_type, jv.ref_id,
                   (SELECT COUNT(*) FROM JournalVoucherDetails WHERE jv_id = jv.id) as detail_count
            FROM JournalVouchers jv
            ORDER BY jv.id
        `);
        journals.forEach(j => console.log(`ID: ${j.id}, DocNum: ${j.doc_number}, Source: ${j.source_type}, RefID: ${j.ref_id}, Details: ${j.detail_count}`));

        // Step 2: Find journals with 0 details
        const emptyJournals = journals.filter(j => j.detail_count === 0);
        console.log(`\n=== Journals with 0 details: ${emptyJournals.length} ===`);

        if (emptyJournals.length > 0) {
            // Get GL settings
            const invAcc = await connection.query("SELECT account_id FROM GeneralLedgerSettings WHERE setting_key = 'inventory_account'");
            const apAcc = await connection.query("SELECT account_id FROM GeneralLedgerSettings WHERE setting_key = 'ap_temp_account'");

            const inventoryAccountId = invAcc.length > 0 ? invAcc[0].account_id : null;
            const apTempAccountId = apAcc.length > 0 ? apAcc[0].account_id : null;

            console.log(`\nGL Settings: Inventory=${inventoryAccountId}, AP Temp=${apTempAccountId}`);

            for (const j of emptyJournals) {
                console.log(`\nProcessing Journal ID: ${j.id} (${j.doc_number})`);

                if (j.source_type === 'Receiving' && inventoryAccountId && apTempAccountId) {
                    // Get receiving details to calculate amount
                    const items = await connection.query(`
                        SELECT rd.item_id, rd.quantity, pod.unit_price, (rd.quantity * pod.unit_price) as total_value
                        FROM ReceivingDetails rd
                        JOIN Receivings r ON rd.receiving_id = r.id
                        JOIN PurchaseOrderDetails pod ON r.po_id = pod.po_id AND rd.item_id = pod.item_id
                        WHERE r.id = ?
                    `, [j.ref_id]);

                    const totalAmount = items.reduce((sum, item) => sum + (Number(item.total_value) || 0), 0);
                    console.log(`  Total Amount: ${totalAmount}`);

                    if (totalAmount > 0) {
                        // Insert debit line (Inventory)
                        await connection.query(
                            'INSERT INTO JournalVoucherDetails (jv_id, coa_id, debit, credit, description) VALUES (?, ?, ?, ?, ?)',
                            [j.id, inventoryAccountId, totalAmount, 0, 'Inventory Receipt']
                        );
                        console.log(`  Inserted Debit: ${totalAmount} to COA ${inventoryAccountId}`);

                        // Insert credit line (AP Temp)
                        await connection.query(
                            'INSERT INTO JournalVoucherDetails (jv_id, coa_id, debit, credit, description) VALUES (?, ?, ?, ?, ?)',
                            [j.id, apTempAccountId, 0, totalAmount, 'AP Temporary']
                        );
                        console.log(`  Inserted Credit: ${totalAmount} to COA ${apTempAccountId}`);
                    }
                }
            }
        }

        // Step 3: Verify
        console.log('\n=== Verification ===');
        const finalJournals = await connection.query(`
            SELECT jv.id, jv.doc_number, jv.source_type, jv.ref_id,
                   (SELECT COUNT(*) FROM JournalVoucherDetails WHERE jv_id = jv.id) as detail_count,
                   (SELECT SUM(debit) FROM JournalVoucherDetails WHERE jv_id = jv.id) as total_debit,
                   (SELECT SUM(credit) FROM JournalVoucherDetails WHERE jv_id = jv.id) as total_credit
            FROM JournalVouchers jv
            ORDER BY jv.id
        `);
        finalJournals.forEach(j => console.log(`ID: ${j.id}, DocNum: ${j.doc_number}, Details: ${j.detail_count}, Debit: ${j.total_debit}, Credit: ${j.total_credit}`));

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

checkAndRecreateJournals();
