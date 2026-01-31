import dotenv from 'dotenv';
import odbc from 'odbc';
import path from 'path';

const envPath = path.resolve('d:\\JAGATRAYA ERP', '.env');
const envConfig = dotenv.config({ path: envPath }).parsed;

async function run() {
    try {
        const connectionString = `Driver={SQL Anywhere 17};Host=${envConfig.DB_HOST}:${envConfig.DB_PORT};DatabaseName=${envConfig.DB_NAME};Uid=${envConfig.DB_USER};Pwd=${envConfig.DB_PASSWORD};`;
        const connection = await odbc.connect(connectionString);

        // Find invoice with amount 24150000 or close
        const result = await connection.query("SELECT * FROM APInvoices WHERE total_amount = 24150000 OR (total_amount > 20000000)");
        console.log('Matches:', JSON.stringify(result, null, 2));

        await connection.close();
    } catch (e) {
        console.log('Error:', e);
    }
}

run();
