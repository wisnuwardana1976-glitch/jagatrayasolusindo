
import odbc from 'odbc';

const connectionString = `Driver={SQL Anywhere 17};Host=localhost:2638;DatabaseName=JAGATRAYA_V17;UID=dba;PWD=sql123`;

async function run() {
    try {
        const connection = await odbc.connect(connectionString);
        console.log('Connected to DB');

        console.log('Checking InventoryAdjustmentDetails for Item 1:');
        const details = await connection.query(`SELECT * FROM InventoryAdjustmentDetails WHERE item_id = 1`);

        console.log(JSON.stringify(details, null, 2));

        await connection.close();

    } catch (e) {
        console.error('Error:', e.message);
    }
}

run();
