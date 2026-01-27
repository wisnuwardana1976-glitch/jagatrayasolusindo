import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function run() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected to database.');

        // Find orphans
        const orphans = await connection.query(`
      SELECT j.id, j.ref_id, j.doc_number 
      FROM JournalVouchers j 
      LEFT JOIN Shipments s ON j.ref_id = s.id 
      WHERE j.source_type = 'Shipment' AND s.id IS NULL
    `);

        console.log(`Found ${orphans.length} orphaned Shipment journals.`);

        if (orphans.length > 0) {
            for (const journal of orphans) {
                console.log(`Deleting Journal #${journal.id} (Ref: ${journal.ref_id}, Doc: ${journal.doc_number})...`);
                try {
                    // Delete details first
                    await connection.query('DELETE FROM JournalVoucherDetails WHERE jv_id = ?', [journal.id]);
                    // Delete header
                    await connection.query('DELETE FROM JournalVouchers WHERE id = ?', [journal.id]);
                    console.log('Deleted.');
                } catch (err) {
                    console.error(`Failed to delete journal ${journal.id}:`, err.message);
                }
            }
            console.log('Cleanup complete.');
        } else {
            console.log('No orphans to clean.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

run();
