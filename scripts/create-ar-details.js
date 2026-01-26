import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function createTable() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected.');

        const query = `
            CREATE TABLE ARInvoiceDetails (
                id INTEGER PRIMARY KEY DEFAULT AUTOINCREMENT,
                ar_invoice_id INTEGER NOT NULL,
                item_id INTEGER NULL,
                description VARCHAR(255),
                quantity NUMERIC(18,4),
                unit_price NUMERIC(18,2),
                line_total NUMERIC(18,2),
                FOREIGN KEY (ar_invoice_id) REFERENCES ARInvoices (id) ON DELETE CASCADE,
                FOREIGN KEY (item_id) REFERENCES Items (id)
            )
        `;

        await connection.query(query);
        console.log('Table ARInvoiceDetails created successfully.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

createTable();
