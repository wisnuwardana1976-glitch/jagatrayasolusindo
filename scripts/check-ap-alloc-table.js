import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function checkTable() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected.');

        try {
            await connection.query("SELECT count(*) as count FROM APAdjustmentAllocations");
            console.log('✅ Table APAdjustmentAllocations EXISTS.');
        } catch (e) {
            console.log('❌ Table APAdjustmentAllocations DOES NOT EXIST or Error:', e.message);
        }

    } catch (error) {
        console.error('Connection Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

checkTable();
