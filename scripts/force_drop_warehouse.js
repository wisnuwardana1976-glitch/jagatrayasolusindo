
import odbc from 'odbc';

const connectionString = `Driver={SQL Anywhere 17};Host=localhost:2638;DatabaseName=JAGATRAYA_V17;UID=dba;PWD=sql123`;

async function run() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected to DB');

        // Check before
        let cols = await connection.query(`SELECT column_name FROM syscolumn JOIN systable ON syscolumn.table_id = systable.table_id WHERE table_name = 'ItemConversions' AND column_name = 'warehouse_id'`);
        if (cols.length === 0) {
            console.log('Column warehouse_id NOT found before drop.');
        } else {
            console.log('Column warehouse_id FOUND before drop.');

            console.log('Attempting DROP...');
            try {
                // Try dropping constraint if any (just in case default constraint exists)
                // await connection.query(`ALTER TABLE ItemConversions DELETE warehouse_id`); // Sybase syntax?
                // Standard:
                await connection.query(`ALTER TABLE ItemConversions DROP warehouse_id`);
            } catch (e) {
                console.error('Drop failed:', e.message);
            }

            // Re-check
            cols = await connection.query(`SELECT column_name FROM syscolumn JOIN systable ON syscolumn.table_id = systable.table_id WHERE table_name = 'ItemConversions' AND column_name = 'warehouse_id'`);
            if (cols.length === 0) {
                console.log('SUCCESS: Column warehouse_id is GONE.');
            } else {
                console.error('FAILURE: Column warehouse_id is STILL THERE.');
            }
        }

    } catch (e) {
        console.error('Script Error:', e.message);
    } finally {
        if (connection) await connection.close();
    }
}

run();
