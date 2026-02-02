
import odbc from 'odbc';

const connectionString = `Driver={SQL Anywhere 17};Host=localhost:2638;DatabaseName=JAGATRAYA_V17;UID=dba;PWD=sql123`;

async function run() {
    try {
        const connection = await odbc.connect(connectionString);
        console.log('Connected to DB');

        const itemId = process.argv[2] ? parseInt(process.argv[2]) : 1;
        console.log(`Checking ItemStocks for Item ${itemId}:`);
        const stocks = await connection.query(`SELECT * FROM ItemStocks WHERE item_id = ?`, [itemId]);

        console.log(JSON.stringify(stocks, null, 2));

        await connection.close();

    } catch (e) {
        console.error('Error:', e.message);
    }
}

run();
