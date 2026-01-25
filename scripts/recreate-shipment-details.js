import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function recreateDetails() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected.');

        // 1. Rename existing
        try {
            try { await connection.query("DROP TABLE ShipmentDetails_Bak"); } catch (e) { }
            await connection.query("ALTER TABLE ShipmentDetails RENAME ShipmentDetails_Bak");
            console.log('Renamed ShipmentDetails to ShipmentDetails_Bak.');
        } catch (e) {
            console.log('Rename failed:', e.message);
        }

        // 2. Create New
        await connection.query(`
            CREATE TABLE ShipmentDetails (
                id INTEGER NOT NULL PRIMARY KEY DEFAULT AUTOINCREMENT,
                shipment_id INTEGER,
                item_id INTEGER,
                quantity NUMERIC(18,4) DEFAULT 0,
                remarks VARCHAR(255)
            )
        `);
        console.log('Created ShipmentDetails table.');

        // 3. Migrate Data
        // Note: Data migration might fail if shipment_id FK is enforced and parent doesn't exist.
        // But here we just created the table without explicit FK constraint in SQL (unless auto).
        try {
            await connection.query(`
                INSERT INTO ShipmentDetails (id, shipment_id, item_id, quantity, remarks)
                SELECT id, shipment_id, item_id, quantity, remarks FROM ShipmentDetails_Bak
            `);
            console.log('Migrated data.');
        } catch (e) {
            console.log('Migration failed:', e.message);
        }

    } catch (error) {
        console.log('Error:', error.message);
    } finally {
        if (connection) await connection.close();
    }
}

recreateDetails();
