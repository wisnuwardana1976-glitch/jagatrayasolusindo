import dotenv from 'dotenv';
import odbc from 'odbc';
import path from 'path';

const envPath = path.resolve('d:\\JAGATRAYA ERP', '.env');
const envConfig = dotenv.config({ path: envPath }).parsed;

async function run() {
    try {
        const connectionString = `Driver={SQL Anywhere 17};Host=${envConfig.DB_HOST}:${envConfig.DB_PORT};DatabaseName=${envConfig.DB_NAME};Uid=${envConfig.DB_USER};Pwd=${envConfig.DB_PASSWORD};`;
        const connection = await odbc.connect(connectionString);

        console.log('Checking AR Details for ID 32...');
        const result = await connection.query("SELECT * FROM ARInvoiceDetails WHERE ar_invoice_id = 32"); // Assuming ar_invoice_id
        console.log('Details:', JSON.stringify(result, null, 2));

        // Also check if any ARInvoiceDetails at all?
        if (result.length === 0) {
            const any = await connection.query("SELECT top 1 * FROM ARInvoiceDetails");
            console.log('Sample detail col check:', Object.keys(any[0] || {}));
        }

        await connection.close();
    } catch (e) {
        console.log('Error:', e);
        // Fallback column check if query failed
    }
}

run();
