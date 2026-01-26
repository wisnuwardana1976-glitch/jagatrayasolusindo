import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function testInsert() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected.');

        const query = `INSERT INTO ARInvoices (doc_number, doc_date, due_date, partner_id, shipment_id, total_amount, status, notes, transcode_id, tax_type, sales_person_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const params = ['ARI/TEST/RAW/001', '2026-01-26', '2026-01-26', 3, 15, 4000000, 'Draft', 'Raw insert', 8, 'Exclude', 1];

        await connection.query(query, params);
        console.log('Insert Success');

    } catch (error) {
        console.error('Insert Error:', error);
        if (error.odbcErrors) console.error('ODBC Errors:', error.odbcErrors);
    } finally {
        if (connection) await connection.close();
    }
}

testInsert();
