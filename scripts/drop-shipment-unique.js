import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function dropUnique() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected.');

        // Try multiple syntaxes
        try {
            await connection.query("ALTER TABLE Shipments DROP UNIQUE (so_id)");
            console.log('Dropped unique constraint on so_id.');
        } catch (e) {
            console.log('Failed DROP UNIQUE (so_id):', e.message);
        }

        try {
            await connection.query("DROP INDEX Shipments_so_id");
            console.log('Dropped index Shipments_so_id.');
        } catch (e) {
            // ignore
        }

    } catch (error) {
        console.log('Error:', error.message);
    } finally {
        if (connection) await connection.close();
    }
}

dropUnique();
