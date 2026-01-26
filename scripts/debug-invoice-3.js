// Check AP Invoice ID 3 details
import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function checkInvoice3() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);

        console.log('Checking AP Invoice ID 3...');
        const header = await connection.query('SELECT * FROM APInvoices WHERE id = 3');
        console.log('Header:', header[0]);

        const details = await connection.query('SELECT * FROM APInvoiceDetails WHERE ap_invoice_id = 3');
        console.log(`Details count: ${details.length}`);
        details.forEach(d => console.log(`  Item: ${d.item_id}, RecID: ${d.receiving_id}`));

        if (details.length > 0 && details[0].receiving_id) {
            console.log(`\nAttempting update for ID 3...`);
            await connection.query('UPDATE APInvoices SET receiving_id = ? WHERE id = 3', [details[0].receiving_id]);
            console.log('Update executed.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        if (connection) await connection.close();
    }
}

checkInvoice3();
