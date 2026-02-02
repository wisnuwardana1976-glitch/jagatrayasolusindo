
import odbc from 'odbc';

const connectionString = `Driver={SQL Anywhere 17};Host=localhost:2638;DatabaseName=JAGATRAYA_V17;UID=dba;PWD=sql123`;

async function run() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected.');

        // Get FKs with names
        const fks = await connection.query(`
            SELECT f.role, t.table_name, c.column_name
            FROM sysforeignkey f
            JOIN sysfkcol fc ON f.foreign_table_id = fc.foreign_table_id AND f.foreign_key_id = fc.foreign_key_id
            JOIN syscolumn c ON fc.foreign_table_id = c.table_id AND fc.foreign_column_id = c.column_id
            JOIN systable t ON f.foreign_table_id = t.table_id
            WHERE t.table_name = 'ItemConversions'
        `);
        console.log('Foreign Keys:', JSON.stringify(fks, null, 2));

        // Get Indexes
        const idx = await connection.query(`
            SELECT i.index_name, c.column_name 
            FROM sysindex i 
            JOIN systable t ON i.table_id = t.table_id 
            JOIN sysidxcol ic ON i.table_id = ic.table_id AND i.index_id = ic.index_id
            JOIN syscolumn c ON ic.table_id = c.table_id AND ic.column_id = c.column_id
            WHERE t.table_name = 'ItemConversions'
        `);
        console.log('Indexes:', JSON.stringify(idx, null, 2));

    } catch (e) {
        console.error('Error:', e);
    } finally {
        if (connection) await connection.close();
    }
}

run();
