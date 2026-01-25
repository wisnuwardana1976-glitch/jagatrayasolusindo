import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function fixTables() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected to database.');

        // Step 1: Drop ShipmentDetails completely (it has FK issues)
        console.log('Dropping ShipmentDetails...');
        try {
            await connection.query('DROP TABLE ShipmentDetails');
            console.log('Dropped ShipmentDetails.');
        } catch (e) {
            console.log('Error dropping ShipmentDetails:', e.message);
        }

        // Step 2: Drop ShipmentDetails_Bak if exists
        try {
            await connection.query('DROP TABLE ShipmentDetails_Bak');
            console.log('Dropped ShipmentDetails_Bak.');
        } catch (e) {
            // Ignore
        }

        // Step 3: Create fresh ShipmentDetails without FK
        console.log('Creating ShipmentDetails...');
        await connection.query(`
            CREATE TABLE ShipmentDetails (
                id INTEGER NOT NULL PRIMARY KEY DEFAULT AUTOINCREMENT,
                shipment_id INTEGER,
                item_id INTEGER,
                quantity NUMERIC(18,4) DEFAULT 0,
                remarks VARCHAR(255)
            )
        `);
        console.log('Created ShipmentDetails successfully.');

        console.log('Done! Tables are fixed.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

fixTables();
