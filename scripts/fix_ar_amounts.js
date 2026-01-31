import dotenv from 'dotenv';
import odbc from 'odbc';
import path from 'path';

const envPath = path.resolve('d:\\JAGATRAYA ERP', '.env');
const envConfig = dotenv.config({ path: envPath }).parsed;

async function run() {
    try {
        const connectionString = `Driver={SQL Anywhere 17};Host=${envConfig.DB_HOST}:${envConfig.DB_PORT};DatabaseName=${envConfig.DB_NAME};Uid=${envConfig.DB_USER};Pwd=${envConfig.DB_PASSWORD};`;
        const connection = await odbc.connect(connectionString);
        console.log('Connected. Fixing AR Amounts (0 or NULL)...');

        // Check count before
        const before = await connection.query("SELECT COUNT(*) as count FROM ARInvoices WHERE total_amount IS NULL OR total_amount = 0");
        console.log('Zero/Null rows before:', before[0].count);

        const query = `
            UPDATE ARInvoices 
            SET total_amount = (
                SELECT SUM(line_total) 
                FROM ARInvoiceDetails 
                WHERE ARInvoiceDetails.ar_invoice_id = ARInvoices.id
            )
            WHERE (total_amount IS NULL OR total_amount = 0)
            AND EXISTS (SELECT 1 FROM ARInvoiceDetails WHERE ar_invoice_id = ARInvoices.id)
        `;

        await connection.query(query);

        // Fix Paid Amount if null
        await connection.query("UPDATE ARInvoices SET paid_amount = 0 WHERE paid_amount IS NULL");

        const after = await connection.query("SELECT COUNT(*) as count FROM ARInvoices WHERE total_amount IS NULL OR total_amount = 0");
        console.log('Zero/Null rows after:', after[0].count);

        await connection.close();
        console.log('Done.');
    } catch (e) {
        console.log('Error:', e);
    }
}

run();
