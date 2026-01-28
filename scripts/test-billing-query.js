
import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function run() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);

        console.log('--- Testing Billing Query Logic ---');
        // Test Receiving 11 (RCV/012026/0026)
        const recId = 11;

        console.log(`Checking Receiving ID: ${recId}`);

        const q1 = `
            SELECT COALESCE(SUM(apd.quantity), 0) as total_billed 
            FROM APInvoiceDetails apd 
            JOIN APInvoices api ON apd.ap_invoice_id = api.id 
            WHERE apd.receiving_id = ${recId} AND api.status <> 'Cancelled'
        `;
        const res1 = await connection.query(q1);
        console.log(`Query 1 (Total Billed):`, res1[0]);

        const q2 = `
             SELECT COALESCE(SUM(rd.quantity), 0) as total_received
             FROM ReceivingDetails rd 
             WHERE rd.receiving_id = ${recId}
        `;
        const res2 = await connection.query(q2);
        console.log(`Query 2 (Total Received):`, res2[0]);

    } catch (error) {
        console.error(error);
    } finally {
        if (connection) await connection.close();
    }
}
run();
