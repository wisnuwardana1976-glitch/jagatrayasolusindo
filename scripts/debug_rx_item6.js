
import odbc from 'odbc';

const connectionString = `Driver={SQL Anywhere 17};Host=localhost:2638;DatabaseName=JAGATRAYA_V17;UID=dba;PWD=sql123`;

async function run() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected.');

        console.log('Fetching Receiving for Item 6...');
        const rxs = await connection.query(`
            SELECT r.id, r.doc_number, r.location_id as h_loc, rd.location_id as d_loc, rd.quantity
            FROM Receivings r
            JOIN ReceivingDetails rd ON r.id = rd.receiving_id
            WHERE rd.item_id = 6
        `);
        console.log(JSON.stringify(rxs, null, 2));

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        if (connection) await connection.close();
    }
}

run();
