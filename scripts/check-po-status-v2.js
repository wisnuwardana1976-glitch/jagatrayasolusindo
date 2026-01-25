import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function checkPO() {
    try {
        const connection = await odbc.connect(connectionString);
        const result = await connection.query(`SELECT status FROM PurchaseOrders WHERE doc_number = 'PO/012026/0006'`);
        if (result.length > 0) {
            console.log('PO STATUS:', result[0].status);
        } else {
            console.log('PO not found');
        }
        await connection.close();
    } catch (error) {
        console.error(error);
    }
}

checkPO();
