import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function createTables() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected to database.');

        // APInvoices Table
        try {
            await connection.query(`
                CREATE TABLE APInvoices (
                    id INTEGER NOT NULL PRIMARY KEY DEFAULT AUTOINCREMENT,
                    doc_number VARCHAR(50) NOT NULL UNIQUE,
                    doc_date DATE NOT NULL,
                    partner_id INTEGER NOT NULL,
                    due_date DATE,
                    status VARCHAR(20) DEFAULT 'Draft',
                    notes LONG VARCHAR,
                    transcode_id INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT TIMESTAMP
                )
            `);
            console.log('Created APInvoices table.');
        } catch (e) {
            console.log('APInvoices table might already exist:', e.message);
        }

        // APInvoiceDetails Table
        try {
            await connection.query(`
                CREATE TABLE APInvoiceDetails (
                    id INTEGER NOT NULL PRIMARY KEY DEFAULT AUTOINCREMENT,
                    ap_invoice_id INTEGER NOT NULL,
                    item_id INTEGER,
                    description VARCHAR(255),
                    quantity NUMERIC(18,4) DEFAULT 0,
                    unit_price NUMERIC(18,2) DEFAULT 0,
                    amount NUMERIC(18,2) DEFAULT 0,
                    receiving_id INTEGER,
                    CONSTRAINT FK_APInvoiceDetails_APInvoice FOREIGN KEY (ap_invoice_id) REFERENCES APInvoices (id) ON DELETE CASCADE
                )
            `);
            console.log('Created APInvoiceDetails table.');
        } catch (e) {
            console.log('APInvoiceDetails table might already exist:', e.message);
        }

    } catch (error) {
        console.error('Connection error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

createTables();
