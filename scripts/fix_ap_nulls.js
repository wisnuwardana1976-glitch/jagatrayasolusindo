import dotenv from 'dotenv';
import odbc from 'odbc';
import path from 'path';

const envPath = path.resolve('d:\\JAGATRAYA ERP', '.env');
const envConfig = dotenv.config({ path: envPath }).parsed;

async function run() {
    try {
        const connectionString = `Driver={SQL Anywhere 17};Host=${envConfig.DB_HOST}:${envConfig.DB_PORT};DatabaseName=${envConfig.DB_NAME};Uid=${envConfig.DB_USER};Pwd=${envConfig.DB_PASSWORD};`;
        const connection = await odbc.connect(connectionString);
        console.log('Connected. Fixing NULL Total Amounts...');

        // Check count before
        const before = await connection.query("SELECT COUNT(*) as count FROM APInvoices WHERE total_amount IS NULL");
        console.log('Null rows before:', before[0].count);

        const query = `
            UPDATE APInvoices 
            SET total_amount = (
                SELECT SUM(amount) 
                FROM APInvoiceDetails 
                WHERE APInvoiceDetails.ap_invoice_id = APInvoices.id
            )
            WHERE total_amount IS NULL
        `;

        await connection.query(query);

        // Fix Paid Amount if null? (Usually defaults to 0, but check)
        await connection.query("UPDATE APInvoices SET paid_amount = 0 WHERE paid_amount IS NULL");

        const after = await connection.query("SELECT COUNT(*) as count FROM APInvoices WHERE total_amount IS NULL");
        console.log('Null rows after:', after[0].count);

        await connection.close();
        console.log('Done.');
    } catch (e) {
        console.log('Error:', e);
    }
}

run();
