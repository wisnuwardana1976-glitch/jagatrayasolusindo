import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function updateSchema() {
    let connection;
    try {
        console.log('Connecting...');
        connection = await odbc.connect(connectionString);

        // 1. Update LocationTransfers ----------------------
        // Drop existing tables (Data loss! Ensure only testing data)
        try {
            await connection.query("DROP TABLE LocationTransferDetails");
            console.log('Dropped LocationTransferDetails');
        } catch (e) { /* Ignore */ }

        try {
            await connection.query("DROP TABLE LocationTransfers");
            console.log('Dropped LocationTransfers');
        } catch (e) { /* Ignore */ }

        // Create with Location IDs
        // Note: Assuming Locations table exists (Locations(id)).
        // Also keeping warehouse_id for easier reporting/filtering, but logic will use location_id
        console.log('Creating LocationTransfers (Location Based)...');
        await connection.query(`
            CREATE TABLE LocationTransfers (
                id INTEGER NOT NULL DEFAULT AUTOINCREMENT PRIMARY KEY,
                doc_number VARCHAR(50) NOT NULL,
                doc_date DATE NOT NULL,
                source_location_id INTEGER NOT NULL,
                destination_location_id INTEGER NOT NULL,
                status VARCHAR(20) DEFAULT 'Draft',
                notes LONG VARCHAR,
                transcode_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT TIMESTAMP,
                FOREIGN KEY (source_location_id) REFERENCES Locations(id),
                FOREIGN KEY (destination_location_id) REFERENCES Locations(id)
            )
        `);
        await connection.query('CREATE UNIQUE INDEX UQ_LocationTransfers_DocNum ON LocationTransfers(doc_number)');

        console.log('Creating LocationTransferDetails...');
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
        await connection.query('CREATE INDEX IDX_LocationTransferDetails_TransferId ON LocationTransferDetails(transfer_id)');


        // 2. Update ItemStocks -----------------------------
        // Check if location_id exists
        let hasLocationCol = false;
        try {
            await connection.query("SELECT location_id FROM ItemStocks LIMIT 1");
            hasLocationCol = true;
            console.log('ItemStocks already has location_id');
        } catch (e) {
            console.log('ItemStocks missing location_id. Adding...');
        }

        if (!hasLocationCol) {
            await connection.query("ALTER TABLE ItemStocks ADD location_id INTEGER NULL"); // Nullable for WH-level stock (legacy)
            await connection.query("ALTER TABLE ItemStocks ADD FOREIGN KEY (location_id) REFERENCES Locations(id)");
            console.log('Added location_id column to ItemStocks');
        }

        // Update Unique Constraint
        // Try to drop old UQ_ItemWarehouse
        try {
            await connection.query("DROP INDEX ItemStocks.UQ_ItemWarehouse");
            console.log('Dropped old UQ_ItemWarehouse index');
        } catch (e) {
            console.log('Old index UQ_ItemWarehouse not found or cannot drop (might be using different name or Primary Key).');
            // If PK is just ID, then UQ was an index.
        }

        // Add new Unique Constraint (item, warehouse, location)
        try {
            // Note: Depending on Sybase version, NULL in unique index allows single NULL or multiple NULLs.
            // Usually we want (item_id, warehouse_id, location_id) to be unique.
            await connection.query("CREATE UNIQUE INDEX UQ_ItemStock_Location ON ItemStocks (item_id, warehouse_id, location_id)");
            console.log('Created new unique index UQ_ItemStock_Location');
        } catch (e) {
            console.log('Could not create new unique index (maybe already exists): ' + e.message);
        }

        console.log('✅ Schema Updated Successfully');

    } catch (e) {
        console.error('❌ Error:', e.message);
        if (e.odbcErrors) console.error('ODBC Error:', e.odbcErrors[0]?.message);
    } finally {
        if (connection) await connection.close();
    }
}

updateSchema();
