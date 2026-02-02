
import odbc from 'odbc';

const connectionString = `Driver={SQL Anywhere 17};Host=localhost:2638;DatabaseName=JAGATRAYA_V17;UID=dba;PWD=sql123`;

async function run() {
    try {
        const connection = await odbc.connect(connectionString);
        console.log('Connected to DB');

        console.log('Checking Foreign Keys for Receivings table:');

        // Sybase specific system table query for constraints
        const res = await connection.query(`
            SELECT 
                fk.role AS constraint_name, 
                pt.table_name AS primary_table, 
                ft.table_name AS foreign_table
            FROM SYS.SYSFOREIGNKEY fk
            JOIN SYS.SYSTABLE pt ON fk.primary_table_id = pt.table_id
            JOIN SYS.SYSTABLE ft ON fk.foreign_table_id = ft.table_id
            WHERE ft.table_name = 'Receivings'
        `);

        res.forEach(r => console.log(JSON.stringify(r)));

        // Check columns to be sure warehouse_id is there
        const cols = await connection.query(`SELECT TOP 1 * FROM Receivings`);
        console.log('Cols:', Object.keys(cols[0]));

        await connection.close();
    } catch (e) {
        console.error(e);
    }
}

run();
