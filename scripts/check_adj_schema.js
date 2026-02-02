
import odbc from 'odbc';

const connectionString = `Driver={SQL Anywhere 17};Host=localhost:2638;DatabaseName=JAGATRAYA_V17;UID=dba;PWD=sql123`;

async function run() {
    try {
        const connection = await odbc.connect(connectionString);
        console.log('Connected to DB');

        console.log('Checking columns for InventoryAdjustmentDetails table:');
        const cols = await connection.query(`SELECT column_name FROM syscolumn JOIN systable ON syscolumn.table_id = systable.table_id WHERE table_name = 'InventoryAdjustmentDetails'`);

        console.log('Columns:', cols.map(c => c.column_name));

        await connection.close();

    } catch (e) {
        console.error('Error:', e.message);
    }
}

run();
