import dotenv from 'dotenv';
import odbc from 'odbc';
import path from 'path';

const envPath = path.resolve('d:\\JAGATRAYA ERP', '.env');
const envConfig = dotenv.config({ path: envPath }).parsed;

async function run() {
    try {
        const connectionString = `Driver={SQL Anywhere 17};Host=${envConfig.DB_HOST}:${envConfig.DB_PORT};DatabaseName=${envConfig.DB_NAME};Uid=${envConfig.DB_USER};Pwd=${envConfig.DB_PASSWORD};`;
        const connection = await odbc.connect(connectionString);

        const result = await connection.query("SELECT i.id, i.doc_number, i.total_amount, p.name as partner_name FROM ARInvoices i LEFT JOIN Partners p ON i.partner_id = p.id WHERE i.id = 32");
        console.log('AR 32:', JSON.stringify(result, null, 2));

        await connection.close();
    } catch (e) {
        console.log('Error:', e);
    }
}

run();
