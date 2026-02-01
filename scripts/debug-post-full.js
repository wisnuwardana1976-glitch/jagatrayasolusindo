
import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function debugPostFull() {
    let connection;
    try {
        console.log('🔄 Connecting to database...');
        connection = await odbc.connect(connectionString);

        // 1. Get the latest Draft item conversion
        const [conv] = await connection.query(`SELECT TOP 1 * FROM ItemConversions WHERE status = 'Draft' ORDER BY id DESC`);
        if (!conv) {
            console.log('No draft conversion found.');
            return;
        }
        console.log(`Found conversion ID: ${conv.id}`);

        // 2. Journal Creation Test
        console.log('Testing Journal creation...');

        // Get inventory account
        const invAccResult = await connection.query("SELECT id FROM Accounts WHERE type = 'ASSET' AND (name LIKE '%Persediaan%' OR name LIKE '%Inventory%')");
        console.log('Accounting query result:', invAccResult);

        const inventoryAccountId = invAccResult.length > 0 ? invAccResult[0].id : null;
        console.log('Inventory Account ID:', inventoryAccountId);

        if (!inventoryAccountId) {
            console.error('❌ No inventory account found!');
            return;
        }

        try {
            await connection.query('BEGIN TRANSACTION');

            const jvNumber = `TEST-JV-CONV-${conv.doc_number}`;
            const totalInput = parseFloat(conv.total_input_amount) || 0;
            const totalOutput = parseFloat(conv.total_output_amount) || 0;

            console.log('Inserting JV Header...');
            await connection.query(`
                INSERT INTO JournalVouchers (doc_number, doc_date, description, status, source_type, ref_id)
                VALUES (?, ?, ?, 'Posted', 'ITEM_CONVERSION', ?)
            `, [jvNumber, conv.doc_date, `Item Conversion: ${conv.doc_number}`, conv.id]);
            console.log('✅ JV Header inserted.');

            const jvResult = await connection.query('SELECT @@IDENTITY as id');
            const jvId = Number(jvResult[0].id);
            console.log(`JV ID: ${jvId}`);

            console.log('Inserting JV Details...');
            if (totalInput > 0) {
                await connection.query(
                    'INSERT INTO JournalVoucherDetails (jv_id, coa_id, description, debit, credit) VALUES (?, ?, ?, 0, ?)',
                    [jvId, inventoryAccountId, 'Bahan Input Konversi', totalInput]
                );
            }
            if (totalOutput > 0) {
                await connection.query(
                    'INSERT INTO JournalVoucherDetails (jv_id, coa_id, description, debit, credit) VALUES (?, ?, ?, ?, 0)',
                    [jvId, inventoryAccountId, 'Hasil Output Konversi', totalOutput]
                );
            }
            console.log('✅ JV Details inserted.');

            console.log('Rolling back...');
            await connection.query('ROLLBACK');
            console.log('✅ Rollback successful. Test PASSED.');

        } catch (e) {
            console.error('❌ Journal creation failed:', e.message);
            await connection.query('ROLLBACK');
        }

    } catch (error) {
        console.error('❌ Error details:', error);
    } finally {
        if (connection) await connection.close();
    }
}

debugPostFull();
