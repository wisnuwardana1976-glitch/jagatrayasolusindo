
import odbc from 'odbc';

const connectionString = `Driver={SQL Anywhere 17};Host=localhost:2638;DatabaseName=JAGATRAYA_V17;UID=dba;PWD=sql123`;

async function run() {
    try {
        const connection = await odbc.connect(connectionString);
        console.log('Connected to DB');

        console.log('Checking Indexes for ItemStocks:');
        const indexes = await connection.query(`
            SELECT i.index_name, c.column_name, i.\"unique\"
            FROM sysindex i
            JOIN systable t ON i.table_id = t.table_id
            JOIN sysidxcol ic ON i.table_id = ic.table_id AND i.index_id = ic.index_id
            JOIN syscolumn c ON ic.table_id = c.table_id AND ic.column_id = c.column_id
            WHERE t.table_name = 'ItemStocks'
            ORDER BY i.index_name, ic.sequence
        `);

        console.log(JSON.stringify(indexes, null, 2));

        await connection.close();

    } catch (e) {
        console.error('Error:', e.message);
    }
}

run();
