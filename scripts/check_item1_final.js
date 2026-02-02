
import odbc from 'odbc';

const connectionString = `Driver={SQL Anywhere 17};Host=localhost:2638;DatabaseName=JAGATRAYA_V17;UID=dba;PWD=sql123`;

async function run() {
    try {
        const connection = await odbc.connect(connectionString);
        console.log('Connected to DB');

        const itemId = 1;

        console.log(`\nChecking ItemStocks for Item ${itemId}:`);
        const stocks = await connection.query(`SELECT * FROM ItemStocks WHERE item_id = ?`, [itemId]);
        stocks.forEach(s => console.log(JSON.stringify(s)));

        // Ensure no null/0 location
        const bad = stocks.filter(s => !s.location_id || s.location_id === 0);
        if (bad.length > 0) {
            console.log('FAIL: Still entries with missing location.');
        } else {
            console.log('SUCCESS: All entries have valid location.');
        }

        await connection.close();

    } catch (e) {
        console.error(e);
    }
}

run();
