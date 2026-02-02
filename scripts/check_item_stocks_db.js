
import odbc from 'odbc';

const connectionString = `Driver={SQL Anywhere 17};Host=localhost:2638;DatabaseName=JAGATRAYA_V17;UID=dba;PWD=sql123`;

async function run() {
    try {
        const connection = await odbc.connect(connectionString);
        console.log('Connected to DB');

        const items = [7, 6];
        const warehouseId = 2;

        console.log('Checking ItemStocks table directly:');

        for (const itemId of items) {
            const res = await connection.query(`SELECT * FROM ItemStocks WHERE item_id = ? AND warehouse_id = ?`, [itemId, warehouseId]);
            console.log(`Item ${itemId} WH ${warehouseId}: Found ${res.length} rows.`);
            res.forEach(r => console.log(JSON.stringify(r)));
        }

        await connection.close();

    } catch (e) {
        console.error(e);
    }
}

run();
