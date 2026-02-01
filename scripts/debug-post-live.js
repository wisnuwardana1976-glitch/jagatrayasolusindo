
import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function debugPostLive() {
    let connection;
    try {
        console.log('🔄 Connecting to database...');
        try {
            connection = await odbc.connect(connectionString);
        } catch (e) {
            console.error("Connection failed", e);
            return;
        }

        // 1. Get the latest Draft item conversion
        const [conv] = await connection.query(`SELECT TOP 1 * FROM ItemConversions WHERE status = 'Draft' ORDER BY id DESC`);
        if (!conv) {
            console.log('No draft conversion found.');
            return;
        }
        console.log(`Found conversion ID: ${conv.id}`);

        // Get Input/Output items logic (simplified from server/index.js)
        const details = await connection.query('SELECT * FROM ItemConversionDetails WHERE conversion_id = ?', [conv.id]);
        const inputItems = details.filter(d => d.detail_type === 'INPUT');
        const outputItems = details.filter(d => d.detail_type === 'OUTPUT');

        console.log(`Input: ${inputItems.length}, Output: ${outputItems.length}`);

        // Get inventory account
        const invAccResult = await connection.query("SELECT id FROM Accounts WHERE type = 'ASSET' AND (name LIKE '%Persediaan%' OR name LIKE '%Inventory%') LIMIT 1");
        const inventoryAccountId = invAccResult.length > 0 ? invAccResult[0].id : null;
        console.log('Inventory Account ID:', inventoryAccountId);

        if (inventoryAccountId) {
            const jvNumber = `JV-CONV-${conv.doc_number}`;
            const totalInput = parseFloat(conv.total_input_amount) || 0;
            const totalOutput = parseFloat(conv.total_output_amount) || 0;

            console.log('Creating JV:', jvNumber, 'Total Input:', totalInput, 'Total Output:', totalOutput);

            try {
                // START TRANSACTION
                await connection.query('BEGIN TRANSACTION');

                await connection.query(`
                  INSERT INTO JournalVouchers (doc_number, doc_date, description, status, source_type, ref_id)
                  VALUES (?, ?, ?, 'Posted', 'ITEM_CONVERSION', ?)
                `, [jvNumber, conv.doc_date, `Item Conversion: ${conv.doc_number}`, conv.id]);

                const jvResult = await connection.query('SELECT @@IDENTITY as id');
                const jvId = Number(jvResult[0].id);
                console.log('JV Header Created, ID:', jvId);

                // Insert details...
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

                // Handle gain/loss if input != output
                const diff = totalOutput - totalInput;
                if (Math.abs(diff) > 0.01) {
                    if (diff > 0) {
                        await connection.query(
                            'INSERT INTO JournalVoucherDetails (jv_id, coa_id, description, debit, credit) VALUES (?, ?, ?, 0, ?)',
                            [jvId, inventoryAccountId, 'Selisih Konversi (Gain)', diff]
                        );
                    } else {
                        await connection.query(
                            'INSERT INTO JournalVoucherDetails (jv_id, coa_id, description, debit, credit) VALUES (?, ?, ?, ?, 0)',
                            [jvId, inventoryAccountId, 'Selisih Konversi (Loss)', Math.abs(diff)]
                        );
                    }
                }

                console.log('JV Details Created.');

                console.log('Simulating Update Status...');
                await connection.query(`UPDATE ItemConversions SET status = 'Posted', updated_at = CURRENT TIMESTAMP WHERE id = ?`, [conv.id]);

                // ROLLBACK FOR TEST
                await connection.query('ROLLBACK');
                console.log('✅ Simulation Passed (Rolled back)');

            } catch (e) {
                console.error('❌ Error creating JV in simulation:', e.message);
                console.error(e);
                await connection.query('ROLLBACK');
            }
        }

    } catch (error) {
        console.error('❌ Error details:', error);
    } finally {
        if (connection) await connection.close();
    }
}

debugPostLive();
