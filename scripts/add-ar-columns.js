import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function addColumns() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected.');

        const alterations = [
            "ALTER TABLE ARInvoices ADD tax_type VARCHAR(20) DEFAULT 'Exclude'",
            "ALTER TABLE ARInvoices ADD transcode_id INTEGER",
            "ALTER TABLE ARInvoices ADD notes LONG VARCHAR"
        ];

        for (const sql of alterations) {
            try {
                await connection.query(sql);
                console.log(`Executed: ${sql}`);
            } catch (e) {
                console.log(`Error executing ${sql}:`, e.message);
            }
        }

    } catch (error) {
        console.error('Connection Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

addColumns();
