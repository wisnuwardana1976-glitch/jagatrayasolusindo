import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function checkColumns() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        // We might not have data, so let's try to get column names from empty result metadata logic if supported, 
        // or just force add the column again if we are unsure.
        // Better yet, just try to ADD the column. If it errors "column already exists", then we know.
        // If it succeeds, then it was missing.
        try {
            await connection.query("ALTER TABLE Shipments ADD transcode_id INTEGER");
            console.log("Column transcode_id added successfully.");
        } catch (e) {
            console.log("Alter table failed (expected if column exists):", e.message);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

checkColumns();
