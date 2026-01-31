import dotenv from 'dotenv';
import odbc from 'odbc';
import path from 'path';

const envPath = path.resolve('d:\\JAGATRAYA ERP', '.env');
const envConfig = dotenv.config({ path: envPath }).parsed;

async function run() {
    try {
        const connectionString = `Driver={SQL Anywhere 17};Host=${envConfig.DB_HOST}:${envConfig.DB_PORT};DatabaseName=${envConfig.DB_NAME};Uid=${envConfig.DB_USER};Pwd=${envConfig.DB_PASSWORD};`;
        const connection = await odbc.connect(connectionString);

        const result = await connection.query('SELECT top 1 * FROM APInvoiceDetails');
        console.log('Columns:', Object.keys(result[0] || {}));

        await connection.close();
    } catch (e) {
        console.log('Error:', e);
    }
}

run();
