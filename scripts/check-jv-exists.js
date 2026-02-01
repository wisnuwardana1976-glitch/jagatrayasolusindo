import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function main() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        const res = await connection.query("SELECT * FROM JournalVouchers WHERE doc_number = ?", ['JV-APADJ-APAI/012026/0005']);
        console.log('Result:', JSON.stringify(res, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (connection) await connection.close();
    }
}

main();
