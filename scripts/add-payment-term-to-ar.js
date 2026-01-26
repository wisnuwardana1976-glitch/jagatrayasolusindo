import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function addColumn() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected.');

        try {
            await connection.query("ALTER TABLE ARInvoices ADD payment_term_id INTEGER");
            console.log('Executed: ALTER TABLE ARInvoices ADD payment_term_id INTEGER');
        } catch (e) {
            console.log('Error executing ALTER (might already exist):', e.message);
        }

    } catch (error) {
        console.error('Connection Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

addColumn();
