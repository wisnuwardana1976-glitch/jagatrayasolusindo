
// Running as valid ESM
// converting to ESM for internal usage compatibility if needed, but standard node script usually plain JS.
// I'll use the Odbc wrapper pattern or just plain fetch if server is running. Server is running.

// Let's use specific Odbc direct check to be sure about DB state
import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function run() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);

        console.log('--- Inspecting AP Invoices ---');
        // Get recent AP Invoices
        const invs = await connection.query(`SELECT TOP 5 * FROM APInvoices ORDER BY id DESC`);

        for (const inv of invs) {
            console.log(`\nInvoice: ${inv.doc_number} (ID: ${inv.id}, Status: '${inv.status}', Rec ID: ${inv.receiving_id})`);

            // Get Details
            const details = await connection.query(`SELECT * FROM APInvoiceDetails WHERE ap_invoice_id = ${inv.id}`);
            console.log('Details:');
            details.forEach(d => {
                console.log(`  - Item: ${d.item_id}, Qty: ${d.quantity}, Rec ID (Detail): ${d.receiving_id}`);
            });

            if (inv.receiving_id) {
                const rec = await connection.query(`SELECT * FROM Receivings WHERE id = ${inv.receiving_id}`);
                console.log(`  -> Linked Receiving: ${rec[0]?.doc_number} (ID: ${rec[0]?.id})`);
            }
        }

    } catch (error) {
        console.error(error);
    } finally {
        if (connection) await connection.close();
    }
}
run();
