import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function main() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);

        // Test data for AR Adjustment
        const data = {
            doc_number: 'TEST-AR-ADJ-001',
            doc_date: '2026-01-31',
            adjustment_type: 'DEBIT',
            transcode_id: 1, // Assume 1 is a valid transcode
            partner_id: 2,   // Assume 2 is a valid partner
            counter_account_id: 15, // Assume 15 is a valid account
            amount: 1000000,
            notes: 'Test AR Adjustment Save',
            allocate_to_invoice: 'N'
        };

        console.log('Testing AR Adjustment Save...');
        // We'll simulate the SQL query from the app.post handler
        try {
            await connection.query(`
          INSERT INTO ARAdjustments (doc_number, doc_date, type, transcode_id, partner_id, counter_account_id, total_amount, description, status, allocate_to_invoice)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Draft', ?)
        `, [data.doc_number, data.doc_date, data.adjustment_type, data.transcode_id || null, data.partner_id, data.counter_account_id, data.amount, data.notes || '', data.allocate_to_invoice || 'N']);

            console.log('SUCCESS: AR Adjustment saved correctly.');

            // Clean up
            await connection.query("DELETE FROM ARAdjustments WHERE doc_number = 'TEST-AR-ADJ-001'");
        } catch (saveError) {
            console.error('FAILED: AR Adjustment save error:', saveError.message);
        }

    } catch (error) {
        console.error('Connection Error:', error.message);
    } finally {
        if (connection) await connection.close();
    }
}

main();
