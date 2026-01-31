import dotenv from 'dotenv';
import odbc from 'odbc';
import path from 'path';

const envPath = path.resolve('d:\\JAGATRAYA ERP', '.env');
const envConfig = dotenv.config({ path: envPath }).parsed;

async function run() {
    try {
        const connectionString = `Driver={SQL Anywhere 17};Host=${envConfig.DB_HOST}:${envConfig.DB_PORT};DatabaseName=${envConfig.DB_NAME};Uid=${envConfig.DB_USER};Pwd=${envConfig.DB_PASSWORD};`;
        const connection = await odbc.connect(connectionString);
        console.log('Connected. Fixing AP Mismatches...');

        const query = `
            UPDATE APInvoices 
            SET total_amount = (
                SELECT SUM(amount) 
                FROM APInvoiceDetails 
                WHERE APInvoiceDetails.ap_invoice_id = APInvoices.id
            )
            WHERE total_amount IS NULL 
               OR total_amount <> (
                SELECT SUM(amount) 
                FROM APInvoiceDetails 
                WHERE APInvoiceDetails.ap_invoice_id = APInvoices.id
            )
        `;

        const result = await connection.query(query);
        console.log('Updated rows (Total Amount mismatch):', result.rowsAffected || 'Unknown');

        // Fix Negative Paid Amounts
        const fixPaid = await connection.query("UPDATE APInvoices SET paid_amount = 0 WHERE paid_amount < 0");
        console.log('Fixed negative paid amounts');

        await connection.close();
        console.log('Done.');
    } catch (e) {
        console.log('Error:', e);
    }
}

run();
