
import odbc from 'odbc';

const connectionString = `Driver={SQL Anywhere 17};Host=localhost:2638;DatabaseName=JAGATRAYA_V17;UID=dba;PWD=sql123`;

async function run() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected to DB');

        console.log('Fetching ItemStockHistory for 2026-01...');
        const history = await connection.query(`
            SELECT TOP 10 * FROM ItemStockHistory WHERE period = '2026-01' ORDER BY item_id, location_id
        `);
        console.log(JSON.stringify(history, null, 2));

        console.log('Checking Item 1 (COM001?)...');
        const item1 = await connection.query(`
            SELECT * FROM ItemStockHistory WHERE item_id = 1 AND period = '2026-01'
        `);
        console.log(JSON.stringify(item1, null, 2));

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        if (connection) await connection.close();
    }
}

run();
