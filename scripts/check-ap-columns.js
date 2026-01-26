import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function checkColumns() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected.');

        console.log('--- APInvoices Columns ---');
        const res1 = await connection.query("select list(column_name) as cols from syscolumn key join systable where table_name = 'APInvoices'");
        console.log(res1[0].cols);

        console.log('--- APInvoiceDetails Columns ---');
        const res2 = await connection.query("select list(column_name) as cols from syscolumn key join systable where table_name = 'APInvoiceDetails'");
        console.log(res2[0].cols);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

checkColumns();
