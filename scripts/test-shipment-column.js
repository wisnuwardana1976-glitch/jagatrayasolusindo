import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function testColumn() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected.');
        try {
            await connection.query('SELECT TOP 1 transcode_id FROM Shipments');
            console.log('Column transcode_id EXISTS.');
        } catch (e) {
            console.error('Column transcode_id MISSING (Select failed):', e.message);
            // Try adding it
            try {
                await connection.query('ALTER TABLE Shipments ADD transcode_id INTEGER NULL');
                console.log('Attempted to ADD transcode_id.');
            } catch (adderror) {
                console.error('Failed to ADD transcode_id:', adderror.message);
            }
        }
    } catch (error) {
        console.error('Connection Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

testColumn();
