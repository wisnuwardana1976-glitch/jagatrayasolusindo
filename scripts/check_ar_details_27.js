import dotenv from 'dotenv';
import odbc from 'odbc';
import path from 'path';

const envPath = path.resolve('d:\\JAGATRAYA ERP', '.env');
const envConfig = dotenv.config({ path: envPath }).parsed;

async function run() {
    try {
        const connectionString = `Driver={SQL Anywhere 17};Host=${envConfig.DB_HOST}:${envConfig.DB_PORT};DatabaseName=${envConfig.DB_NAME};Uid=${envConfig.DB_USER};Pwd=${envConfig.DB_PASSWORD};`;
        const connection = await odbc.connect(connectionString);

        console.log('Checking AR Details for ID 27 (ARI/012026/0014)...');

        const details = await connection.query("SELECT * FROM ARInvoiceDetails WHERE ar_invoice_id = 27");
        console.log('Details:', JSON.stringify(details, null, 2));

        let sum = 0;
        details.forEach(d => sum += parseFloat(d.line_total || 0));
        console.log('Calculated Sum:', sum);

        const header = await connection.query("SELECT total_amount, paid_amount FROM ARInvoices WHERE id = 27");
        console.log('Header Amount:', header[0].total_amount);
        console.log('Header Paid:', header[0].paid_amount);

        await connection.close();
    } catch (e) {
        console.log('Error:', e);
    }
}

run();
