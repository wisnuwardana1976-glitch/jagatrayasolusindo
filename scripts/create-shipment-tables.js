import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function createShipmentTables() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected to database.');

        // Create Shipments Table
        try {
            await connection.query(`
                CREATE TABLE Shipments (
                    id INTEGER PRIMARY KEY DEFAULT AUTOINCREMENT,
                    doc_number VARCHAR(50) NOT NULL UNIQUE,
                    doc_date DATE NOT NULL,
                    so_id INTEGER,
                    partner_id INTEGER,
                    shipping_address TEXT,
                    status VARCHAR(20) DEFAULT 'Draft',
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT TIMESTAMP,
                    FOREIGN KEY (so_id) REFERENCES SalesOrders(id),
                    FOREIGN KEY (partner_id) REFERENCES Partners(id)
                )
            `);
            console.log('Shipments table created.');
        } catch (e) {
            console.log('Shipments table might already exist:', e.message);
        }

        // Create ShipmentDetails Table
        try {
            await connection.query(`
                CREATE TABLE ShipmentDetails (
                    id INTEGER PRIMARY KEY DEFAULT AUTOINCREMENT,
                    shipment_id INTEGER NOT NULL,
                    item_id INTEGER NOT NULL,
                    quantity NUMERIC(18, 4) NOT NULL,
                    remarks TEXT,
                    FOREIGN KEY (shipment_id) REFERENCES Shipments(id) ON DELETE CASCADE,
                    FOREIGN KEY (item_id) REFERENCES Items(id)
                )
            `);
            console.log('ShipmentDetails table created.');
        } catch (e) {
            console.log('ShipmentDetails table might already exist:', e.message);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

createShipmentTables();
