
import odbc from 'odbc';

const connectionString = `Driver={SQL Anywhere 17};Host=localhost:2638;DatabaseName=JAGATRAYA_V17;UID=dba;PWD=sql123`;

async function run() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected.');

        const tables = ['InventoryAdjustments', 'ItemConversions'];

        for (const t of tables) {
            console.log(`\n--- Columns of ${t} ---`);
            const cols = await connection.query(`SELECT column_name FROM syscolumn JOIN systable ON syscolumn.table_id = systable.table_id WHERE table_name = '${t}'`);
            const colNames = cols.map(c => c.column_name);
            console.log('Columns:', colNames.join(', '));
            if (colNames.includes('created_at')) console.log('Has created_at: YES');
            else console.log('Has created_at: NO');
        }

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        if (connection) await connection.close();
    }
}

run();
