import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function updatePO() {
    try {
        const connection = await odbc.connect(connectionString);
        await connection.query(`UPDATE PurchaseOrders SET status = 'Closed' WHERE doc_number = 'PO/012026/0006'`);
        console.log('PO/012026/0006 status updated to Closed');
        await connection.close();
    } catch (error) {
        console.error(error);
    }
}

updatePO();
