import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function recreateTable() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected.');

        // 1. Rename existing
        try {
            // Drop backup if exists from previous run
            try { await connection.query("DROP TABLE Shipments_Bak"); } catch (e) { }

            await connection.query("ALTER TABLE Shipments RENAME Shipments_Bak");
            console.log('Renamed Shipments to Shipments_Bak.');
        } catch (e) {
            console.log('Rename failed (maybe table missing?):', e.message);
        }

        // 2. Create New
        // Use LONG VARCHAR for notes to be safe, or just VARCHAR(2000)
        // Sybase: LONG VARCHAR is good for text.
        await connection.query(`
            CREATE TABLE Shipments (
                id INTEGER NOT NULL PRIMARY KEY DEFAULT AUTOINCREMENT,
                doc_number VARCHAR(50) NOT NULL,
                doc_date DATE NOT NULL,
                so_id INTEGER,
                partner_id INTEGER,
                status VARCHAR(20) DEFAULT 'Draft',
                transcode_id INTEGER,
                notes LONG VARCHAR
            )
        `);
        console.log('Created Shipments table.');

        // 3. Migrate Data
        try {
            await connection.query(`
                INSERT INTO Shipments (id, doc_number, doc_date, so_id, partner_id, status, transcode_id, notes)
                SELECT id, doc_number, doc_date, so_id, partner_id, status, transcode_id, notes FROM Shipments_Bak
            `);
            console.log('Migrated data.');
        } catch (e) {
            console.log('Migration failed (maybe empty?):', e.message);
        }

    } catch (error) {
        console.log('Error:', error.message);
    } finally {
        if (connection) await connection.close();
    }
}

recreateTable();
