import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function testQuery() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected.');

        // Test simple query
        console.log('\n--- Test 1: Simple select ---');
        const res1 = await connection.query('SELECT id, doc_number, status, total_amount, paid_amount FROM APInvoices');
        console.log('Found', res1.length, 'invoices');
        console.log(res1);

        // Test with partner filter
        console.log('\n--- Test 2: With partner_id = 2 ---');
        const res2 = await connection.query('SELECT id, doc_number, status, total_amount, paid_amount FROM APInvoices WHERE partner_id = 2');
        console.log('Found', res2.length, 'invoices for partner 2');
        console.log(res2);

        // Test full query
        console.log('\n--- Test 3: Full query with COALESCE ---');
        const res3 = await connection.query(`
          SELECT id, doc_number, doc_date,
            COALESCE(total_amount, 0) as total_amount,
            COALESCE(paid_amount, 0) as paid_amount
          FROM APInvoices
          WHERE partner_id = 2 AND status = 'Posted'
          ORDER BY doc_date ASC
        `);
        console.log('Found', res3.length, 'posted invoices');
        console.log(res3);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

testQuery();
