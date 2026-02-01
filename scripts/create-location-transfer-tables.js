import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function createTables() {
    let connection;
    try {
        console.log('Connecting...');
        connection = await odbc.connect(connectionString);

        // LocationTransfers
        try {
            await connection.query("SELECT TOP 1 * FROM LocationTransfers");
            console.log('✅ Table LocationTransfers already exists.');
        } catch (e) {
            console.log('Creating LocationTransfers table...');
            await connection.query(`
                CREATE TABLE LocationTransfers (
                    id INTEGER NOT NULL DEFAULT AUTOINCREMENT PRIMARY KEY,
                    doc_number VARCHAR(50) NOT NULL,
                    doc_date DATE NOT NULL,
                    source_warehouse_id INTEGER NOT NULL,
                    destination_warehouse_id INTEGER NOT NULL,
                    status VARCHAR(20) DEFAULT 'Draft',
                    notes LONG VARCHAR,
                    transcode_id INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT TIMESTAMP,
                    FOREIGN KEY (source_warehouse_id) REFERENCES Warehouses(id),
                    FOREIGN KEY (destination_warehouse_id) REFERENCES Warehouses(id)
                )
            `);
            // Add unique index on doc_number
            await connection.query('CREATE UNIQUE INDEX UQ_LocationTransfers_DocNum ON LocationTransfers(doc_number)');
            console.log('✅ Table LocationTransfers created successfully.');
        }

        // LocationTransferDetails
        try {
            await connection.query("SELECT TOP 1 * FROM LocationTransferDetails");
            console.log('✅ Table LocationTransferDetails already exists.');
        } catch (e) {
            console.log('Creating LocationTransferDetails table...');
            await connection.query(`
                CREATE TABLE LocationTransferDetails (
                    id INTEGER NOT NULL DEFAULT AUTOINCREMENT PRIMARY KEY,
                    transfer_id INTEGER NOT NULL,
                    item_id INTEGER NOT NULL,
                    quantity NUMERIC(18, 4) NOT NULL DEFAULT 0,
                    notes LONG VARCHAR,
                    FOREIGN KEY (transfer_id) REFERENCES LocationTransfers(id) ON DELETE CASCADE,
                    FOREIGN KEY (item_id) REFERENCES Items(id)
                )
            `);
            // Add index for fast lookups
            await connection.query('CREATE INDEX IDX_LocationTransferDetails_TransferId ON LocationTransferDetails(transfer_id)');
            console.log('✅ Table LocationTransferDetails created successfully.');
        }

    } catch (e) {
        console.error('❌ Error:', e.message);
        if (e.odbcErrors) console.error('ODBC Error:', e.odbcErrors[0]?.message);
    } finally {
        if (connection) await connection.close();
    }
}

createTables();
