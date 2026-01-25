import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function checkStatuses() {
    try {
        const connection = await odbc.connect(connectionString);

        console.log('--- Distinct PO Statuses ---');
        const statuses = await connection.query(`SELECT DISTINCT status FROM PurchaseOrders`);
        console.log(statuses);

        console.log('\n--- Details for PO/012026/0006 ---');
        const po = await connection.query(`SELECT * FROM PurchaseOrders WHERE doc_number = 'PO/012026/0006'`);
        console.log(po);

        await connection.close();
    } catch (error) {
        console.error(error);
    }
}

checkStatuses();
