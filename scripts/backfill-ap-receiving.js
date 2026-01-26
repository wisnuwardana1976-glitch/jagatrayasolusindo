// Script to backfill APInvoices.receiving_id from APInvoiceDetails
import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function backfillReceivingId() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await odbc.connect(connectionString);

        // Find AP Invoices with missing receiving_id
        const invoices = await connection.query(`
            SELECT id, doc_number 
            FROM APInvoices 
            WHERE receiving_id IS NULL
        `);
        console.log(`Found ${invoices.length} invoices without receiving_id.`);

        let updatedCount = 0;

        for (const inv of invoices) {
            // Check if details have receiving_id
            const details = await connection.query(`
                SELECT DISTINCT receiving_id 
                FROM APInvoiceDetails 
                WHERE ap_invoice_id = ? AND receiving_id IS NOT NULL
            `, [inv.id]);

            if (details.length > 0) {
                // Use the first receiving_id found (assuming 1 invoice = 1 receiving usually)
                const recId = details[0].receiving_id;

                await connection.query(`
                    UPDATE APInvoices 
                    SET receiving_id = ? 
                    WHERE id = ?
                `, [recId, inv.id]);

                console.log(`Updated Invoice ${inv.doc_number} (ID: ${inv.id}) with receiving_id: ${recId}`);
                updatedCount++;
            }
        }

        console.log(`Backfill complete. Updated ${updatedCount} invoices.`);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

backfillReceivingId();
