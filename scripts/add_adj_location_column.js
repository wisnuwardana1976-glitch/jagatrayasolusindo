
import odbc from 'odbc';

const connectionString = `Driver={SQL Anywhere 17};Host=localhost:2638;DatabaseName=JAGATRAYA_V17;UID=dba;PWD=sql123`;

async function run() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected.');

        // 1. Add Column
        console.log('Adding location_id column...');
        try {
            await connection.query(`ALTER TABLE InventoryAdjustmentDetails ADD location_id INTEGER`);
            console.log('Column Added.');
        } catch (e) {
            console.log('Column Add Error (maybe exists):', e.message);
        }

        // 2. Backfill Data
        console.log('Backfilling location_id = 2 for existing records...');
        const result = await connection.query(`UPDATE InventoryAdjustmentDetails SET location_id = 2 WHERE location_id IS NULL`);
        console.log('Backfill completed.');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        if (connection) await connection.close();
    }
}

run();
