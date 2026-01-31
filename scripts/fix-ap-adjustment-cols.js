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
        console.log('Connected.');

        // Add transcode_id
        try {
            await connection.query("ALTER TABLE APAdjustments ADD transcode_id INTEGER");
            console.log('✅ Added transcode_id.');
        } catch (e) {
            console.log('Info transcode_id:', e.message);
        }

        // Add counter_account_id
        try {
            await connection.query("ALTER TABLE APAdjustments ADD counter_account_id INTEGER");
            console.log('✅ Added counter_account_id.');
        } catch (e) {
            console.log('Info counter_account_id:', e.message);
        }

        // Rename columns if we really wanted to, but better to update code. 
        // For now just allow nulls usually.

    } catch (error) {
        console.error('Connection Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

fixSchema();
