
import odbc from 'odbc';

const connectionString = `Driver={SQL Anywhere 17};Host=localhost:2638;DatabaseName=JAGATRAYA_V17;UID=dba;PWD=sql123`;

async function run() {
    try {
        const connection = await odbc.connect(connectionString);
        console.log('Connected to DB');

        console.log('Finding locations for Warehouse 2:');
        const locs = await connection.query(`
            SELECT l.id, l.code, l.name 
            FROM Locations l
            JOIN SubWarehouses sw ON l.sub_warehouse_id = sw.id
            WHERE sw.warehouse_id = 2
        `);

        console.log('Locations:', locs);

        await connection.close();

    } catch (e) {
        console.error('Error:', e.message);
    }
}

run();
