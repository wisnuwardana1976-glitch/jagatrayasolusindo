import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function fixSchema() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected to database.');

        // ARAdjustments
        const columns = [
            "transcode_id INTEGER",
            "counter_account_id INTEGER",
            "allocate_to_invoice CHAR(1) DEFAULT 'N'"
        ];

        for (const col of columns) {
            try {
                await connection.query(`ALTER TABLE ARAdjustments ADD ${col}`);
                console.log(`✅ Added ${col.split(' ')[0]} to ARAdjustments`);
            } catch (e) {
                console.log(`ℹ️ ARAdjustments.${col.split(' ')[0]}:`, e.message);
            }
        }

        // Also fix foreign keys if possible, but might be complex with ALTER. 
        // We can skip FK constraints for now or try to add them.

    } catch (error) {
        console.error('Connection Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

fixSchema();
