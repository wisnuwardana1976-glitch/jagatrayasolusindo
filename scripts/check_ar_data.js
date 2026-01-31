import dotenv from 'dotenv';
import odbc from 'odbc';
import path from 'path';

const envPath = path.resolve('d:\\JAGATRAYA ERP', '.env');
const envConfig = dotenv.config({ path: envPath }).parsed;

async function run() {
    try {
        const connectionString = `Driver={SQL Anywhere 17};Host=${envConfig.DB_HOST}:${envConfig.DB_PORT};DatabaseName=${envConfig.DB_NAME};Uid=${envConfig.DB_USER};Pwd=${envConfig.DB_PASSWORD};`;
        const connection = await odbc.connect(connectionString);

        console.log('Checking AR Invoices...');

        // Check NULL amounts
        const nulls = await connection.query("SELECT COUNT(*) as count FROM ARInvoices WHERE total_amount IS NULL");
        console.log('Null Total Amounts:', nulls[0].count);

        // Dump some outstanding candidates (Posted/Partial)
        const result = await connection.query("SELECT top 5 id, doc_number, status, total_amount, paid_amount FROM ARInvoices WHERE status IN ('Posted', 'Partial') ORDER BY id DESC");
        console.log('Sample Posted AR:', JSON.stringify(result, null, 2));

        await connection.close();
    } catch (e) {
        console.log('Error:', e);
    }
}

run();
